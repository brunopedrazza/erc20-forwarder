import { task } from "hardhat/config";
import fs from 'fs';
import { string, bigint } from "hardhat/internal/core/params/argumentTypes";


task("predictCloneAddress", "Predict clone address given a master Forwarder and a salt")
    .addParam("salt", "The salt to derive cloned address", undefined, bigint, false)
    .addParam("forwarder", "The Forwarder address to be cloned", undefined, string, true)
    .addParam("factory", "The ForwarderFactory address", undefined, string, true)
    .setAction(async (taskArgs, hre) => {
        const chainId = await hre.network.provider.send("eth_chainId");
        const chainIdInt = parseInt(chainId);

        var masterForwarderAddress = taskArgs.forwarder;
        var forwarderFactoryAddress = taskArgs.factory;
        if (!masterForwarderAddress || !forwarderFactoryAddress) {
            const deployedAddressesPath = `./ignition/deployments/chain-${chainIdInt}/deployed_addresses.json`;
            const data = fs.readFileSync(deployedAddressesPath, 'utf8');
            const parsedData = JSON.parse(data);

            if (!masterForwarderAddress) {
                masterForwarderAddress = parsedData["Forwarder#Forwarder"];
            }
            if (!forwarderFactoryAddress) {
                forwarderFactoryAddress = parsedData["Forwarder#ForwarderFactory"];
            }
        }

        const ForwarderFactory = await hre.ethers.getContractFactory("ForwarderFactory");
        const forwarderFactoryContract = ForwarderFactory.attach(forwarderFactoryAddress);

        console.log(`Getting predicted clone address from master Forwarder ${masterForwarderAddress} with salt ${taskArgs.salt}`);
        const predictedAddress = await forwarderFactoryContract.predictCloneAddress(masterForwarderAddress, taskArgs.salt);
        console.log(`Predicted clone address: ${predictedAddress}`);
    });
