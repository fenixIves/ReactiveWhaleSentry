// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

struct LogRecord {
    uint256 chainId;
    address _contract;
    uint256 topic_0;
    uint256 topic_1;
    uint256 topic_2;
    uint256 topic_3;
    bytes data;
    uint256 blockNumber;
    uint256 opCode;
}

interface IReactive {
    function react(LogRecord calldata log) external;
}
