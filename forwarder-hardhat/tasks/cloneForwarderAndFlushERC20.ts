import { task } from "hardhat/config";
import fs from 'fs';
import { int, string } from "hardhat/internal/core/params/argumentTypes";


task("cloneForwarderAndFlushERC20", "Predict clone address given a master Forwarder and a salt")
    .addParam("salt", "The salt to derive cloned address", undefined, int, false)
    .addParam("token", "The token to flush from cloned forwarder", undefined, string, false)
    .addParam("forwarder", "The Forwarder address to be cloned", undefined, string, true)
    .addParam("factory", "The ForwarderFactory address", undefined, string, true)
    .setAction(async (taskArgs, hre) => {
        const tokenContractAddress = taskArgs.token;
        const salt = parseInt(taskArgs.salt);

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
    
        const Forwarder = await hre.ethers.getContractFactory("Forwarder");
        const ForwarderFactory = await hre.ethers.getContractFactory("ForwarderFactory");
    
        const forwarderFactoryContract = ForwarderFactory.attach(forwarderFactoryAddress);
    
        const cloneResponse = await forwarderFactoryContract.cloneForwarder(masterForwarderAddress, salt);
        const cloneReceipt = await cloneResponse.wait();
    
        const clonedForwarderAddress = cloneReceipt.logs.find( (ev: any) => { return ev.fragment.name == "ClonedAddress"}).args[0];
        console.log(`(${cloneReceipt.hash}) Cloned master Forwarder ${masterForwarderAddress} with salt ${salt} on address ${clonedForwarderAddress}`);
    
        const clonedForwarderContract = Forwarder.attach(clonedForwarderAddress);
    
        const flushResponse = await clonedForwarderContract.flushERC20(tokenContractAddress);
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
    
        console.log(`(${flushReceipt.hash}) Flush Transfer ${convertedAmount} ${tokenSymbol} from ${from} to ${to}`);
    });
