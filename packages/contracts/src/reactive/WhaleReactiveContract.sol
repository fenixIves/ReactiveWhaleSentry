// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AbstractReactive} from "reactive-lib/abstract-base/AbstractReactive.sol";
import {IReactive} from "reactive-lib/interfaces/IReactive.sol";

contract WhaleReactiveContract is IReactive, AbstractReactive {
    uint64 public constant CALLBACK_GAS_LIMIT = 1_000_000;

    uint256 public immutable originChainId;
    uint256 public immutable destinationChainId;
    address public immutable originEmitter;
    address public immutable callbackReceiver;
    uint256 public immutable whaleTopic0;
    address public owner;

    event ReactiveLogAccepted(address indexed whale, uint256 indexed chainId, uint256 amount, int256 pnl, bytes32 strategyTag);
    event SubscriptionRequested(
        uint256 indexed chainId,
        address indexed emitter,
        uint256 indexed topic0,
        uint256 topic1,
        uint256 topic2,
        uint256 topic3
    );
    event OwnerUpdated(address indexed newOwner);

    constructor(
        uint256 originChainId_,
        uint256 destinationChainId_,
        address originEmitter_,
        uint256 whaleTopic0_,
        address callbackReceiver_
    ) payable {
        originChainId = originChainId_;
        destinationChainId = destinationChainId_;
        originEmitter = originEmitter_;
        whaleTopic0 = whaleTopic0_;
        callbackReceiver = callbackReceiver_;
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "owner only");
        _;
    }

    function setOwner(address newOwner) external onlyOwner {
        owner = newOwner;
        emit OwnerUpdated(newOwner);
    }

    function subscribe() external rnOnly onlyOwner {
        service.subscribe(
            originChainId,
            originEmitter,
            whaleTopic0,
            REACTIVE_IGNORE,
            REACTIVE_IGNORE,
            REACTIVE_IGNORE
        );
        emit SubscriptionRequested(
            originChainId,
            originEmitter,
            whaleTopic0,
            REACTIVE_IGNORE,
            REACTIVE_IGNORE,
            REACTIVE_IGNORE
        );
    }

    function unsubscribe() external rnOnly onlyOwner {
        service.unsubscribe(
            originChainId,
            originEmitter,
            whaleTopic0,
            REACTIVE_IGNORE,
            REACTIVE_IGNORE,
            REACTIVE_IGNORE
        );
    }

    function react(LogRecord calldata log) external vmOnly {
        require(log.chain_id == originChainId, "wrong origin chain");
        require(log._contract == originEmitter, "wrong emitter");
        require(log.topic_0 == whaleTopic0, "wrong topic0");

        (uint256 amount, uint256 timestamp, int256 pnl, bytes32 strategyTag) =
            abi.decode(log.data, (uint256, uint256, int256, bytes32));

        address whale = address(uint160(log.topic_1));
        uint256 sourceChainId = log.topic_2;

        bytes memory payload = abi.encodeWithSignature(
            "handleWhaleSignal(address,address,uint256,uint256,uint256,int256,bytes32)",
            address(this),
            whale,
            sourceChainId,
            amount,
            timestamp,
            pnl,
            strategyTag
        );

        emit ReactiveLogAccepted(whale, sourceChainId, amount, pnl, strategyTag);
        emit Callback(destinationChainId, callbackReceiver, CALLBACK_GAS_LIMIT, payload);
    }
}
