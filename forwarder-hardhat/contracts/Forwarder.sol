// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Forwarder {
    // Address to which any funds sent to this contract will be forwarded
    address public parentAddress;

    event ForwarderDeposited(address from, uint256 value, bytes data);

    /**
     * Initialize the contract, and sets the destination address to that of the creator
     */
    function init(address _parentAddress) external onlyUninitialized onlyValidParent(_parentAddress) {
        parentAddress = _parentAddress;
        uint256 value = address(this).balance;

        if (value == 0) {
            return;
        }

        (bool success, ) = parentAddress.call{ value: value }('');
        require(success, "Flush failed");

        // NOTE: since we are forwarding on initialization,
        // we don't have the context of the original sender.
        // We still emit an event about the forwarding but set
        // the sender to the forwarder itself
        emit ForwarderDeposited(address(this), value, msg.data);
    }

    /**
     * Execute a token transfer of the full balance from the forwarder token to the parent address
     * @param tokenContractAddress the address of the erc20 token contract
     */
    function flushTokens(address tokenContractAddress) public onlyInitialized {
        IERC20 tokenContract = ERC20(tokenContractAddress);
        uint256 forwarderBalance = tokenContract.balanceOf(address(this));
        require(forwarderBalance != 0, "Balance should not be zero");

        tokenContract.transfer(parentAddress, forwarderBalance);
    }

    /**
     * Flush the entire balance of the contract to the parent address.
     */
    function flush() public {
        uint256 value = address(this).balance;

        if (value == 0) {
            return;
        }
        if (parentAddress == address(0x0)) {
            return;
        }

        (bool success, ) = parentAddress.call{ value: value }('');
        require(success, "Flush failed");
        emit ForwarderDeposited(msg.sender, value, msg.data);
    }

    /**
     * Modifier that will execute internal code block only if the contract has not been initialized yet
     */
    modifier onlyUninitialized {
        require(parentAddress == address(0x0), "Already initialized");
        _;
    }

    /**
     * Modifier that will execute internal code block only if the contract has not been initialized yet
     */
    modifier onlyInitialized {
        require(parentAddress != address(0x0), "Not initialized");
        _;
    }

    /**
     * Modifier that will execute internal code block only if the parent passed is empty
     */
    modifier onlyValidParent(address _parentAddress) {
        require(_parentAddress != address(0x0), "Parent should not be empty");
        _;
    }

    /**
     * Default function; Gets called when data is sent but does not match any other function
     */
    fallback() external payable {
        flush();
    }

    /**
     * Default function; Gets called when Ether is deposited with no data, and forwards it to the parent address
     */
    receive() external payable {
        flush();
    }
}