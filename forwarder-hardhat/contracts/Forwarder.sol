// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Forwarder {
    address public destination;

    function init(address _destination) public {
        require(_destination != address(0), "Destination should not be empty");
        require(destination == address(0), "Already initialized");
        destination = _destination;
    }

    function flushERC20(address tokenContractAddress) public {
        require(destination != address(0), "Not initialized");
        IERC20 tokenContract = ERC20(tokenContractAddress);
        uint256 forwarderBalance = tokenContract.balanceOf(address(this));

        require(forwarderBalance != 0, "Forwarder balance should not be 0");
        tokenContract.transfer(destination, forwarderBalance);
    }
}