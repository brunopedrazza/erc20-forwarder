// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "./Forwarder.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

contract ForwarderFactory {
    address public implementationAddress;

    event ForwarderCreated(address clonedAddress, address parentAddress);

    constructor(address _implementationAddress) {
        implementationAddress = _implementationAddress;
    }
    
    function cloneForwarder(address parentAddress, uint256 salt) external {
        // include the signers in the salt so any contract deployed to a given address must have the same signers
        bytes32 finalSalt = _getFinalSalt(parentAddress, salt);
        address clonedAddress = Clones.cloneDeterministic(implementationAddress, finalSalt);

        Forwarder(payable(clonedAddress)).init(parentAddress);
        emit ForwarderCreated(clonedAddress, parentAddress);
    }

    function predictCloneAddress(address parentAddress, uint256 salt) public view returns (address)
    {
        bytes32 finalSalt = _getFinalSalt(parentAddress, salt);
        address predictedAddress = Clones.predictDeterministicAddress(implementationAddress, finalSalt);
        return predictedAddress;
    }

    function _getFinalSalt(address parentAddress, uint256 salt) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(parentAddress, bytes32(salt)));
    }
}