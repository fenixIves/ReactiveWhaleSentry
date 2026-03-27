// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AbstractCallback} from "reactive-lib/abstract-base/AbstractCallback.sol";
import {StrategyExecutor} from "./StrategyExecutor.sol";
import {WhaleDataVault} from "./WhaleDataVault.sol";

contract WhaleCallbackReceiver is AbstractCallback {
    address public owner;
    address public expectedReactive;
    WhaleDataVault public immutable vault;
    StrategyExecutor public immutable executor;

    event ExpectedReactiveUpdated(address indexed reactiveContract);
    event WhaleSignalHandled(
        address indexed whale,
        uint256 indexed chainId,
        uint256 amount,
        int256 pnl,
        bytes32 strategyTag,
        address reactiveSender
    );

    constructor(address owner_, address callbackSender_, address vault_, address executor_)
        AbstractCallback(callbackSender_)
        payable
    {
        owner = owner_;
        vault = WhaleDataVault(vault_);
        executor = StrategyExecutor(executor_);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "owner only");
        _;
    }

    function setExpectedReactive(address reactiveContract) external onlyOwner {
        expectedReactive = reactiveContract;
        emit ExpectedReactiveUpdated(reactiveContract);
    }

    function handleWhaleSignal(
        address reactiveSender,
        address whale,
        uint256 chainId,
        uint256 amount,
        uint256 timestamp,
        int256 pnl,
        bytes32 strategyTag
    ) external authorizedSenderOnly returns (uint256 recordId) {
        require(expectedReactive == address(0) || expectedReactive == reactiveSender, "unexpected reactive sender");
        recordId = vault.storeRecord(whale, chainId, amount, timestamp, pnl, strategyTag);
        executor.execute(whale, amount, pnl, strategyTag);
        emit WhaleSignalHandled(whale, chainId, amount, pnl, strategyTag, reactiveSender);
    }
}
