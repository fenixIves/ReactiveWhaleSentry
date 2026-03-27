// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract MinimalSmartAccount {
    address public owner;
    mapping(address => bool) public executors;

    event ExecutorUpdated(address indexed executor, bool allowed);
    event CallExecuted(address indexed target, uint256 value, bytes data);

    constructor(address owner_) {
        owner = owner_;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "owner only");
        _;
    }

    modifier onlyExecutor() {
        require(executors[msg.sender], "executor only");
        _;
    }

    function setExecutor(address executor, bool allowed) external onlyOwner {
        executors[executor] = allowed;
        emit ExecutorUpdated(executor, allowed);
    }

    function execute(address target, uint256 value, bytes calldata data) external onlyExecutor returns (bytes memory result) {
        (bool ok, bytes memory returnedData) = target.call{value: value}(data);
        require(ok, "execution failed");
        emit CallExecuted(target, value, data);
        return returnedData;
    }

    receive() external payable {}
}
