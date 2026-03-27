// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract MockWhaleEmitter {
    event WhaleTradeDetected(
        address indexed whale,
        uint256 indexed sourceChainId,
        uint256 amount,
        uint256 timestamp,
        int256 pnl,
        bytes32 strategyTag
    );

    function emitMockTrade(
        address whale,
        uint256 sourceChainId,
        uint256 amount,
        int256 pnl,
        bytes32 strategyTag
    ) external {
        emit WhaleTradeDetected(whale, sourceChainId, amount, block.timestamp, pnl, strategyTag);
    }
}
