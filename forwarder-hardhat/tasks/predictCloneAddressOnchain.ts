import { task } from "hardhat/config";
import fs from 'fs';
import { string, bigint } from "hardhat/internal/core/params/argumentTypes";


task("predictCloneAddressOnchain", "Predict clone address given a parent and a salt onchain")
    .addParam("salt", "The salt to derive cloned address", undefined, bigint, false)
    .addParam("parent", "The parent to derive cloned address", undefined, string, false)
    .addParam("factory", "The forward factory address", undefined, string, true)
    .setAction(async (taskArgs, hre) => {
        const chainId = await hre.network.provider.send("eth_chainId");
        const chainIdInt = parseInt(chainId);
        const parentAddress = taskArgs.parent;

        var forwarderFactoryAddress = taskArgs.factory;
        if (!forwarderFactoryAddress) {
            const deployedAddressesPath = `./ignition/deployments/chain-${chainIdInt}/deployed_addresses.json`;
            if (!fs.existsSync(deployedAddressesPath)) {
                throw new Error("Please pass factory parameter if no contract is deployed via ignition");
            }
            const data = fs.readFileSync(deployedAddressesPath, 'utf8');
            const parsedData = JSON.parse(data);

            forwarderFactoryAddress = parsedData["Forwarder#ForwarderFactory"];
        }

        const ForwarderFactory = await hre.ethers.getContractFactory("ForwarderFactory");
        const forwarderFactoryContract = ForwarderFactory.attach(forwarderFactoryAddress);

        const factoryAddress = await forwarderFactoryContract.getAddress();
        const implementation = await forwarderFactoryContract.implementationAddress();

        console.log(`Using factory ${factoryAddress} with implementation ${implementation} to clone`);
        console.log(`Getting predicted clone address for parent ${parentAddress} and salt ${taskArgs.salt}`);

        const predictedAddress = await forwarderFactoryContract.predictCloneAddress(parentAddress, taskArgs.salt);

        console.log(`\nPredicted clone address onchain: ${predictedAddress}`);
    });
