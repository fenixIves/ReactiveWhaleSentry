// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IWhaleDataVault {
    function storeRecord(address whale, uint256 chainId, uint256 amount, uint256 timestamp, int256 pnl, bytes32 strategyTag)
        external
        returns (uint256 recordId);
}

interface IStrategyExecutor {
    function execute(address whale, uint256 amount, int256 pnl, bytes32 reason) external;
}

contract WhaleReactiveListener {
    address public owner;
    IWhaleDataVault public immutable vault;
    IStrategyExecutor public immutable executor;
    uint256 public processedCount;

    event MockReactiveProcessed(
        address indexed whale,
        uint256 indexed chainId,
        uint256 amount,
        int256 pnl,
        bytes32 strategyTag,
        uint256 recordId
    );

    constructor(address vault_, address executor_) {
        owner = msg.sender;
        vault = IWhaleDataVault(vault_);
        executor = IStrategyExecutor(executor_);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "owner only");
        _;
    }

    function processMockEvent(
        address whale,
        uint256 chainId,
        uint256 amount,
        uint256 timestamp,
        int256 pnl,
        bytes32 strategyTag
    ) external onlyOwner returns (uint256 recordId) {
        recordId = vault.storeRecord(whale, chainId, amount, timestamp, pnl, strategyTag);
        executor.execute(whale, amount, pnl, strategyTag);
        processedCount += 1;
        emit MockReactiveProcessed(whale, chainId, amount, pnl, strategyTag, recordId);
    }
}
