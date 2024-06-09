// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Forwarder.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

contract ForwarderFactory {
    event ClonedAddress(address indexed cloned);
    
    function cloneForwarder(address forwarder, uint256 salt) public returns (Forwarder clonedForwarder) {
        address clonedAddress = _createClone(forwarder, salt);
        Forwarder parentForwarder = Forwarder(forwarder);
        clonedForwarder = Forwarder(clonedAddress);
        clonedForwarder.init(parentForwarder.destination());
        emit ClonedAddress(clonedAddress);
    }

    function _createClone(address target, uint256 salt) private returns (address result) {
        return Clones.cloneDeterministic(target, bytes32(salt));
    }

    function predictCloneAddress(address forwarder_, uint256 salt_)
        public
        view
        returns (address)
    {
        address predictedAddress =
            Clones.predictDeterministicAddress(
                forwarder_,
                bytes32(salt_)
            );

        return predictedAddress;
    }
}