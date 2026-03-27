// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {StrategyExecutor} from "../src/destination/StrategyExecutor.sol";
import {WhaleDataVault} from "../src/destination/WhaleDataVault.sol";
import {WhaleReactiveListener} from "../src/WhaleReactiveListener.sol";
import {TestBase} from "./TestBase.sol";

contract WhaleFlowTest is TestBase {
    function testProcessMockEventStoresRecordAndExecutesStrategy() public {
        WhaleDataVault vault = new WhaleDataVault(address(this));
        StrategyExecutor executor = new StrategyExecutor(address(this));
        WhaleReactiveListener listener = new WhaleReactiveListener(address(vault), address(executor));

        vault.setWriter(address(listener), true);
        executor.setOperator(address(listener), true);

        bytes32 tag = keccak256("whale-buy");
        uint256 timestamp = 1_710_000_000;
        address whale = address(0xBEEF);

        uint256 recordId = listener.processMockEvent(whale, 8453, 250_000 ether, timestamp, 10 ether, tag);

        WhaleDataVault.WhaleRecord memory record = vault.getRecord(recordId);
        StrategyExecutor.ExecutionRecord memory execution = executor.getExecution(0);

        assertEq(vault.getRecordCount(), 1, "record count mismatch");
        assertEq(record.whale, whale, "stored whale mismatch");
        assertEq(record.chainId, 8453, "stored chain mismatch");
        assertEq(record.amount, 250_000 ether, "stored amount mismatch");
        assertEq(record.timestamp, timestamp, "stored timestamp mismatch");
        assertEq(record.pnl, 10 ether, "stored pnl mismatch");
        assertEq(uint256(executor.currentMode()), uint256(StrategyExecutor.Mode.Observe), "mode should be observe");
        assertEq(executor.getExecutionCount(), 1, "execution count mismatch");
        assertEq(execution.whale, whale, "execution whale mismatch");
        assertEq(listener.processedCount(), 1, "processed count mismatch");
    }

    function testLargeTradeSwitchesToHedgeMode() public {
        WhaleDataVault vault = new WhaleDataVault(address(this));
        StrategyExecutor executor = new StrategyExecutor(address(this));
        WhaleReactiveListener listener = new WhaleReactiveListener(address(vault), address(executor));

        vault.setWriter(address(listener), true);
        executor.setOperator(address(listener), true);

        listener.processMockEvent(address(0xCAFE), 1, 1_500_000 ether, 1_710_000_001, 5 ether, keccak256("hedge"));

        assertEq(uint256(executor.currentMode()), uint256(StrategyExecutor.Mode.Hedge), "mode should be hedge");
    }

    function testNegativePnlSwitchesToGridMode() public {
        WhaleDataVault vault = new WhaleDataVault(address(this));
        StrategyExecutor executor = new StrategyExecutor(address(this));
        WhaleReactiveListener listener = new WhaleReactiveListener(address(vault), address(executor));

        vault.setWriter(address(listener), true);
        executor.setOperator(address(listener), true);

        listener.processMockEvent(address(0xD00D), 42161, 100 ether, 1_710_000_002, -2 ether, keccak256("grid"));

        assertEq(uint256(executor.currentMode()), uint256(StrategyExecutor.Mode.Grid), "mode should be grid");
        assertTrue(vault.writers(address(listener)), "listener should remain authorized writer");
        assertTrue(executor.operators(address(listener)), "listener should remain authorized operator");
    }
}
