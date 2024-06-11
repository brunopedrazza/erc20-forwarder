import { ethers } from "ethers";
const predictDeterministicAddress = require("predict-deterministic-address")

function integerToHex(salt: BigInt) {
    const hexSalt = salt.toString(16).toLowerCase();
    return hexSalt.padStart(64, '0');
}

function getFinalSalt(parentAddress: string, salt: BigInt) {
    return ethers.solidityPackedKeccak256(
        ["address", "bytes32"],
        [parentAddress, `0x${integerToHex(salt)}`]
    );
};

export function predictDeterministicAddressOffchain(implementation: string, factory: string, parentAddress: string, salt: BigInt) {
    const finalSalt = getFinalSalt(parentAddress, salt);
    return predictDeterministicAddress(implementation, finalSalt, factory);
};