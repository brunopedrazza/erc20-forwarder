import fs from 'fs';

export function getDeployedAddressesData(chainId: any) {
    const chainIdInt = parseInt(chainId);
    const deployedAddressesPath = `./ignition/deployments/chain-${chainIdInt}/deployed_addresses.json`;
    if (!fs.existsSync(deployedAddressesPath)) {
        throw new Error("Please pass factory parameter if no contract is deployed via ignition");
    }
    const data = fs.readFileSync(deployedAddressesPath, 'utf8');
    return JSON.parse(data);
};