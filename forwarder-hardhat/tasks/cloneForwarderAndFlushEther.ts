import { task } from "hardhat/config";
import { bigint, string } from "hardhat/internal/core/params/argumentTypes";
import { extractForwarderDeposited } from "../utils/forwarderEventsUtils";
import { getDeployedAddressesData } from "../utils/deployedAddressesUtils";


task("cloneForwarderAndFlushEther", "Clone Forwarder and flush Ether from it")
    .addParam("salt", "The salt to derive cloned address", undefined, bigint, false)
    .addParam("parent", "The parent address to flush tokens to", undefined, string, false)
    .addParam("factory", "The forwarder factory address", undefined, string, true)
    .setAction(async (taskArgs, hre) => {
        const salt = taskArgs.salt;
        const parentAddress = taskArgs.parent;
        
        var forwarderFactoryAddress = taskArgs.factory;
        if (!forwarderFactoryAddress) {
            const chainId = await hre.network.provider.send("eth_chainId");
            const data = getDeployedAddressesData(chainId);
            forwarderFactoryAddress = data["Forwarder#ForwarderFactory"];
        }
        
        const Forwarder = await hre.ethers.getContractFactory("Forwarder");
        const ForwarderFactory = await hre.ethers.getContractFactory("ForwarderFactory");
    
        const forwarderFactoryContract = ForwarderFactory.attach(forwarderFactoryAddress);

        const clonedForwarderAddress = await forwarderFactoryContract.predictCloneAddress(parentAddress, salt);

        const forwarderBalance = await hre.network.provider.send("eth_getBalance", [clonedForwarderAddress, "latest"]);
        if (forwarderBalance == "0x0") {
            console.log(`No ETH to flush on forwarder ${clonedForwarderAddress}`);
            return;
        }
        
        const clonedForwarderContract = Forwarder.attach(clonedForwarderAddress);
        const deployedCode = await clonedForwarderContract.getDeployedCode();

        if (!deployedCode) {
            // If cloned forwarder has balance, Ethers will be flushed on init so it's not necessary to explicitly flush them
            const cloneResponse = await forwarderFactoryContract.cloneForwarder(parentAddress, salt);
            const cloneReceipt = await cloneResponse.wait();
    
            console.log(`(txHash ${cloneReceipt.hash}) Cloned forwarder for parent ${parentAddress} with salt ${salt} on address ${clonedForwarderAddress}`);

            const value = await extractForwarderDeposited(cloneResponse);

            if (!value) {
                console.log("No Ethers to flush");
                return;
            }

            const convertedValue = hre.ethers.formatEther(value);
            console.log(`Flushed ${convertedValue} ETH from ${clonedForwarderAddress} to ${parentAddress}`);
        }
        else {
            console.log(`Cloned forwarder on address ${clonedForwarderAddress} is already initialized`);
        }
    });
