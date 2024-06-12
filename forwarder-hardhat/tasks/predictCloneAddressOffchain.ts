import { task } from "hardhat/config";
import { string, bigint } from "hardhat/internal/core/params/argumentTypes";
import { predictDeterministicAddressOffchain } from "../utils/predictCloneAddressUtils";
import { getDeployedAddressesData } from "../utils/deployedAddressesUtils";

task("predictCloneAddressOffchain", "Predict clone address given a parent and a salt offchain")
    .addParam("salt", "The salt to derive cloned address", undefined, bigint, false)
    .addParam("parent", "The parent to derive cloned address", undefined, string, false)
    .addParam("factory", "The forward factory address", undefined, string, true)
    .setAction(async (taskArgs, hre) => {
        const parentAddress = taskArgs.parent;
        const salt = taskArgs.salt;

        var forwarderFactoryAddress = taskArgs.factory;
        if (!forwarderFactoryAddress) {
            const chainId = await hre.network.provider.send("eth_chainId");
            const data = getDeployedAddressesData(chainId);
            forwarderFactoryAddress = data["Forwarder#ForwarderFactory"];
        }

        const ForwarderFactory = await hre.ethers.getContractFactory("ForwarderFactory");
        const forwarderFactoryContract = ForwarderFactory.attach(forwarderFactoryAddress);
        const implementation = await forwarderFactoryContract.implementationAddress();

        console.log(`Using factory ${forwarderFactoryAddress} with implementation ${implementation} to clone`);
        console.log(`Getting predicted clone address for parent ${parentAddress} and salt ${salt}`);

        const predictedAddressOffchain = predictDeterministicAddressOffchain(implementation, forwarderFactoryAddress, parentAddress, salt);
        console.log(`\nPredicted clone address offchain: ${predictedAddressOffchain}`);
    });
