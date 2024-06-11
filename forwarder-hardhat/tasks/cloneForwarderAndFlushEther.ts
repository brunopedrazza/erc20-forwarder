import { task } from "hardhat/config";
import fs from 'fs';
import { bigint, string } from "hardhat/internal/core/params/argumentTypes";
import { extractClonedForwarderAddress, extractForwarderDeposited } from "../utils/forwarderEventsUtils";


task("cloneForwarderAndFlushEther", "Clone Forwarder and flush Ether from it")
    .addParam("salt", "The salt to derive cloned address", undefined, bigint, false)
    .addParam("parent", "The parent address to flush tokens to", undefined, string, false)
    .addParam("factory", "The forwarder factory address", undefined, string, true)
    .setAction(async (taskArgs, hre) => {
        const salt = taskArgs.salt;
        const parentAddress = taskArgs.parent;

        const chainId = await hre.network.provider.send("eth_chainId");
        const chainIdInt = parseInt(chainId);
        
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
    
        const Forwarder = await hre.ethers.getContractFactory("Forwarder");
        const ForwarderFactory = await hre.ethers.getContractFactory("ForwarderFactory");
    
        const forwarderFactoryContract = ForwarderFactory.attach(forwarderFactoryAddress);
    
        // If cloned forwarder has balance, Ethers will be flushed on init so it's not necessary to explicitly flush them
        const cloneResponse = await forwarderFactoryContract.cloneForwarder(parentAddress, salt);
        const cloneReceipt = await cloneResponse.wait();
        
        const clonedForwarderAddress = await extractClonedForwarderAddress(cloneResponse);
        console.log(`(txHash ${cloneReceipt.hash}) Cloned forwarder for parent ${parentAddress} with salt ${salt} on address ${clonedForwarderAddress}`);

        const value = await extractForwarderDeposited(cloneResponse);

        if (!value) {
            console.log("No Ethers to flush");
            return;
        }

        const convertedValue = hre.ethers.formatEther(value);
        console.log(`Flushed ${convertedValue} ETH from ${clonedForwarderAddress} to ${parentAddress}`);
    });
