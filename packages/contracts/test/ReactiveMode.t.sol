// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {StrategyExecutor} from "../src/destination/StrategyExecutor.sol";
import {WhaleCallbackReceiver} from "../src/destination/WhaleCallbackReceiver.sol";
import {WhaleDataVault} from "../src/destination/WhaleDataVault.sol";
import {WhaleReactiveContract} from "../src/reactive/WhaleReactiveContract.sol";
import {IReactive} from "reactive-lib/interfaces/IReactive.sol";
import {TestBase} from "./TestBase.sol";

contract ReactiveModeTest is TestBase {
    function testReactiveShapeCanDriveCallbackReceiver() public {
        WhaleDataVault vault = new WhaleDataVault(address(this));
        StrategyExecutor executor = new StrategyExecutor(address(this));
        WhaleCallbackReceiver receiver =
            new WhaleCallbackReceiver(address(this), address(this), address(vault), address(executor));

        bytes32 topic0 = keccak256("WhaleTradeDetected(address,uint256,uint256,uint256,int256,bytes32)");

        WhaleReactiveContract reactive =
            new WhaleReactiveContract(11155111, 5318008, address(0x1234), uint256(topic0), address(receiver));

        vault.setWriter(address(receiver), true);
        executor.setOperator(address(receiver), true);
        receiver.setExpectedReactive(address(reactive));

        address whale = address(0xBEEF);
        bytes32 tag = keccak256("reactive-live");

        IReactive.LogRecord memory log = IReactive.LogRecord({
            chain_id: 11155111,
            _contract: address(0x1234),
            topic_0: uint256(topic0),
            topic_1: uint256(uint160(whale)),
            topic_2: 8453,
            topic_3: 0,
            data: abi.encode(500_000 ether, 1_710_000_003, int256(7 ether), tag),
            block_number: 101,
            op_code: 0,
            block_hash: 0,
            tx_hash: 0,
            log_index: 0
        });

        reactive.react(log);
        receiver.handleWhaleSignal(address(reactive), whale, 8453, 500_000 ether, 1_710_000_003, 7 ether, tag);

        WhaleDataVault.WhaleRecord memory record = vault.getRecord(0);

        assertEq(vault.getRecordCount(), 1, "reactive record count mismatch");
        assertEq(record.whale, whale, "reactive whale mismatch");
        assertEq(record.chainId, 8453, "reactive chain mismatch");
        assertEq(record.amount, 500_000 ether, "reactive amount mismatch");
        assertEq(record.timestamp, 1_710_000_003, "reactive timestamp mismatch");
        assertEq(record.pnl, 7 ether, "reactive pnl mismatch");
        assertEq(uint256(executor.currentMode()), uint256(StrategyExecutor.Mode.Observe), "reactive mode mismatch");
        assertEq(reactive.originChainId(), 11155111, "origin chain mismatch");
        assertEq(reactive.destinationChainId(), 5318008, "destination chain mismatch");
    }
}
