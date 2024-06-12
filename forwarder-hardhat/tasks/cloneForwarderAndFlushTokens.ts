import { task } from "hardhat/config";
import { bigint, string } from "hardhat/internal/core/params/argumentTypes";
import { getDeployedAddressesData } from "../utils/deployedAddressesUtils";


task("cloneForwarderAndFlushTokens", "Clone Forwarder and flush tokens from it")
    .addParam("salt", "The salt to derive cloned address", undefined, bigint, false)
    .addParam("parent", "The parent address to flush tokens to", undefined, string, false)
    .addParam("token", "The token to flush from cloned forwarder", undefined, string, false)
    .addParam("factory", "The forwarder factory address", undefined, string, true)
    .setAction(async (taskArgs, hre) => {
        const salt = taskArgs.salt;
        const parentAddress = taskArgs.parent;
        const tokenContractAddress = taskArgs.token;

        const chainId = await hre.network.provider.send("eth_chainId");
        const chainIdInt = parseInt(chainId);
        
        var forwarderFactoryAddress = taskArgs.factory;
        if (!forwarderFactoryAddress) {
            const data = getDeployedAddressesData(chainIdInt);
            forwarderFactoryAddress = data["Forwarder#ForwarderFactory"];
        }

        const TestToken = await hre.ethers.getContractFactory("TestToken");
        const erc20TokenContract = TestToken.attach(tokenContractAddress);
        const tokenDecimals = await erc20TokenContract.decimals();
        const tokenSymbol = await erc20TokenContract.symbol();

        const Forwarder = await hre.ethers.getContractFactory("Forwarder");
        const ForwarderFactory = await hre.ethers.getContractFactory("ForwarderFactory");
        
        const forwarderFactoryContract = ForwarderFactory.attach(forwarderFactoryAddress);

        const clonedForwarderAddress = await forwarderFactoryContract.predictCloneAddress(parentAddress, salt);

        const forwarderBalance = await erc20TokenContract.balanceOf(clonedForwarderAddress);
        if (forwarderBalance == 0) {
            console.log(`No ${tokenSymbol} tokens to flush on forwarder ${clonedForwarderAddress}`);
            return;
        }

        const clonedForwarderContract = Forwarder.attach(clonedForwarderAddress);
        const deployedCode = await clonedForwarderContract.getDeployedCode();

        if (!deployedCode) {
            const cloneResponse = await forwarderFactoryContract.cloneForwarder(parentAddress, salt);
            const cloneReceipt = await cloneResponse.wait();
    
            console.log(`(txHash ${cloneReceipt.hash}) Cloned forwarder for parent ${parentAddress} with salt ${salt} on address ${clonedForwarderAddress}`);
        }
        else {
            console.log(`Cloned forwarder on address ${clonedForwarderAddress} is already initialized`);
        }
    
        const flushResponse = await clonedForwarderContract.flushTokens(tokenContractAddress);
        const flushReceipt = await flushResponse.wait();
    
        const transferEvent = flushReceipt.logs[0];
        const transferAmount = parseInt(transferEvent.data);
    
        let from = transferEvent.topics[1];
        from = hre.ethers.getAddress(from.substring(from.length - 40));
        let to = transferEvent.topics[2];
        to = hre.ethers.getAddress(to.substring(to.length - 40));
    
        const convertedAmount = hre.ethers.formatUnits(BigInt(transferAmount), tokenDecimals);
    
        console.log(`(txHash ${flushReceipt.hash}) Flush Transfer ${convertedAmount} ${tokenSymbol} from ${from} to ${to}`);
    });
