import fs from 'fs';

export function getDeployedAddressesData(chainId: any) {
    const deployedAddressesPath = `./ignition/deployments/chain-${chainId}/deployed_addresses.json`;
    if (!fs.existsSync(deployedAddressesPath)) {
        throw new Error("Please pass factory parameter if no contract is deployed via ignition");
    }
    const data = fs.readFileSync(deployedAddressesPath, 'utf8');
    return JSON.parse(data);
};