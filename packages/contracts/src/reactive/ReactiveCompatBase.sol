// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

abstract contract ReactiveCompatBase {
    event Callback(uint256 indexed chainId, address indexed target, uint64 gasLimit, bytes payload);
    event SubscriptionConfigured(
        uint256 indexed chainId,
        address indexed targetContract,
        uint256 indexed topic0,
        uint256 topic1,
        uint256 topic2,
        uint256 topic3
    );

    uint256 internal constant REACTIVE_IGNORE = type(uint256).max;

    bool public immutable vm;
    address public owner;

    constructor(bool vm_) {
        vm = vm_;
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "owner only");
        _;
    }

    modifier vmOnly() {
        require(vm || msg.sender == owner, "vm only");
        _;
    }

    function _emitSubscription(
        uint256 chainId,
        address targetContract,
        uint256 topic0,
        uint256 topic1,
        uint256 topic2,
        uint256 topic3
    ) internal {
        emit SubscriptionConfigured(chainId, targetContract, topic0, topic1, topic2, topic3);
    }
}
