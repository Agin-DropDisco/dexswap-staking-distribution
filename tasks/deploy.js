const { task } = require("hardhat/config");

    task(
    "deploy",
    "Deploys the whole contracts suite and verifies source code on Etherscan"
    )

    .addFlag("withValidators")

    .addOptionalParam("tokenRegistryAddress", "The token registry address")

    .addOptionalParam("tokenRegistryListId", "The token registry list id to be used to validate tokens")

    .addOptionalParam("factoryAddress", "The address of DexSwap (DEXS)'s pairs factory")

    .addOptionalParam("ownerAddress", "The address of the owner")

    .addFlag(
        "verify",
        "Additional (and optional) Etherscan contracts verification"
    )

    .setAction(async (taskArguments, hre) => {
        const {
            tokenRegistryAddress,
            tokenRegistryListId,
            factoryAddress,
            verify,
            withValidators,
            ownerAddress,
        } = taskArguments;

        if (
            withValidators &&
            (!tokenRegistryAddress || !tokenRegistryListId || !factoryAddress)
        ) {
            throw new Error(
                "token registry address/list di and factory address are required"
            );
        }

        await hre.run("clean");
        await hre.run("compile");

        let rewardTokensValidator = {
            address: "0x0000000000000000000000000000000000000000",
        };

        let stakableTokenValidator = {
            address: "0x0000000000000000000000000000000000000000",
        };

        if (withValidators) {
            const DefaultRewardTokensValidator = hre.artifacts.require(
                "DefaultRewardTokensValidator"
            );

            rewardTokensValidator = await DefaultRewardTokensValidator.new(
                tokenRegistryAddress,
                tokenRegistryListId
            );

            const DefaultStakableTokenValidator = hre.artifacts.require(
                "DefaultStakableTokenValidator"
            );

            stakableTokenValidator = await DefaultStakableTokenValidator.new(
                tokenRegistryAddress,
                tokenRegistryListId,
                factoryAddress
            );
        }

        const ERC20StakingRewardsDistribution = hre.artifacts.require(
            "ERC20StakingRewardsDistribution"
        );

        const erc20DistributionImplementation = await ERC20StakingRewardsDistribution.new();

        const DexswapERC20StakingRewardsDistributionFactory = hre.artifacts.require(
            "DexswapERC20StakingRewardsDistributionFactory"
        );

        const factory = await DexswapERC20StakingRewardsDistributionFactory.new(
            rewardTokensValidator.address,
            stakableTokenValidator.address,
            erc20DistributionImplementation.address
        );

        if (ownerAddress) {

        await factory.transferOwnership(ownerAddress);

        console.log(`ownership transferred to ${ownerAddress}`);

        }

        if (verify) {

        await new Promise((resolve) => {

        console.log("Waiting for Verification Contract...");
        console.log(`--------------------------------------------------------------------------`);

        setTimeout(resolve, 60000);

        });

        if (withValidators) {

        await hre.run("verify", { address: rewardTokensValidator.address,
                constructorArgsParams: [
                    tokenRegistryAddress,
                    tokenRegistryListId,
                ],
        });

        await hre.run("verify", { address: stakableTokenValidator.address,
                constructorArgsParams: [
                    tokenRegistryAddress,
                    tokenRegistryListId,
                    factoryAddress,
                ],
        });

        }

        await hre.run("verify", { address: factory.address,
                constructorArgsParams: [
                    rewardTokensValidator.address,
                    stakableTokenValidator.address,
                    erc20DistributionImplementation.address,
                ],
        });

        console.log(`--------------------------------------------------------------------------`);
        console.log(`Source Code is Verified`);

        }

        if (withValidators) {

        console.log(`--------------------------------------------------------------------------`);
        console.log(`Reward Tokens Validator Address ${rewardTokensValidator.address}`);
        console.log(`--------------------------------------------------------------------------`);

        console.log(`--------------------------------------------------------------------------`);
        console.log(`Stakable Token validator Address ${stakableTokenValidator.address}`);
        console.log(`--------------------------------------------------------------------------`);

        }

        console.log(`--------------------------------------------------------------------------`);
        console.log(`Staking Factory Address : ${factory.address}`);
        console.log(`--------------------------------------------------------------------------`);

    });
