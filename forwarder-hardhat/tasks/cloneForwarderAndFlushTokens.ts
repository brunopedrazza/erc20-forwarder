import { task } from "hardhat/config";
import fs from 'fs';
import { bigint, string } from "hardhat/internal/core/params/argumentTypes";
import { extractClonedForwarderAddress } from "../utils/forwarderEventsUtils";


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
    
        const cloneResponse = await forwarderFactoryContract.cloneForwarder(parentAddress, salt);
        const cloneReceipt = await cloneResponse.wait();
    
        const clonedForwarderAddress = await extractClonedForwarderAddress(cloneResponse);

        console.log(`(txHash ${cloneReceipt.hash}) Cloned forwarder for parent ${parentAddress} with salt ${salt} on address ${clonedForwarderAddress}`);
    
        const clonedForwarderContract = Forwarder.attach(clonedForwarderAddress);
    
        const flushResponse = await clonedForwarderContract.flushTokens(tokenContractAddress);
        const flushReceipt = await flushResponse.wait();
    
        const TestToken = await hre.ethers.getContractFactory("TestToken");
        const erc20TokenContract = TestToken.attach(tokenContractAddress);
    
        const tokenDecimals = await erc20TokenContract.decimals();
        const tokenSymbol = await erc20TokenContract.symbol();
    
        const transferEvent = flushReceipt.logs[0];
        const transferAmount = parseInt(transferEvent.data);
    
        let from = transferEvent.topics[1];
        from = hre.ethers.getAddress(from.substring(from.length - 40));
        let to = transferEvent.topics[2];
        to = hre.ethers.getAddress(to.substring(to.length - 40));
    
        const convertedAmount = hre.ethers.formatUnits(BigInt(transferAmount), tokenDecimals);
    
        console.log(`(txHash ${flushReceipt.hash}) Flush Transfer ${convertedAmount} ${tokenSymbol} from ${from} to ${to}`);
    });
