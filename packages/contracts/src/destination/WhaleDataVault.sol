// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract WhaleDataVault {
    struct WhaleRecord {
        address whale;
        uint256 chainId;
        uint256 amount;
        uint256 timestamp;
        int256 pnl;
        bytes32 strategyTag;
    }

    event WriterUpdated(address indexed writer, bool allowed);
    event RecordStored(uint256 indexed recordId, address indexed whale, uint256 indexed chainId, uint256 amount, int256 pnl);

    address public owner;
    WhaleRecord[] private records;
    mapping(address => bool) public writers;

    constructor(address owner_) {
        owner = owner_;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "owner only");
        _;
    }

    modifier onlyWriter() {
        require(writers[msg.sender], "writer only");
        _;
    }

    function setWriter(address writer, bool allowed) external onlyOwner {
        writers[writer] = allowed;
        emit WriterUpdated(writer, allowed);
    }

    function storeRecord(
        address whale,
        uint256 chainId,
        uint256 amount,
        uint256 timestamp,
        int256 pnl,
        bytes32 strategyTag
    ) external onlyWriter returns (uint256 recordId) {
        recordId = records.length;
        records.push(WhaleRecord(whale, chainId, amount, timestamp, pnl, strategyTag));
        emit RecordStored(recordId, whale, chainId, amount, pnl);
    }

    function getRecord(uint256 index) external view returns (WhaleRecord memory) {
        return records[index];
    }

    function getRecordCount() external view returns (uint256) {
        return records.length;
    }
}
