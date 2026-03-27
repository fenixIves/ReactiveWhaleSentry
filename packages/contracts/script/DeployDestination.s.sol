// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {MinimalSmartAccount} from "../src/destination/MinimalSmartAccount.sol";
import {StrategyExecutor} from "../src/destination/StrategyExecutor.sol";
import {WhaleCallbackReceiver} from "../src/destination/WhaleCallbackReceiver.sol";
import {WhaleDataVault} from "../src/destination/WhaleDataVault.sol";

contract DeployDestinationScript is Script {
    function _privateKey() internal view returns (uint256) {
        string memory raw = vm.envString("DESTINATION_PRIVATE_KEY");
        bytes memory b = bytes(raw);
        if (b.length >= 2 && b[0] == "0" && (b[1] == "x" || b[1] == "X")) {
            return vm.parseUint(raw);
        }
        return vm.parseUint(string.concat("0x", raw));
    }

    function run()
        external
        returns (WhaleDataVault vault, StrategyExecutor executor, WhaleCallbackReceiver receiver, MinimalSmartAccount account)
    {
        uint256 privateKey = _privateKey();
        address owner = vm.addr(privateKey);
        address callbackSender = vm.envAddress("DESTINATION_CALLBACK_PROXY_ADDR");
        uint256 receiverFund = vm.envOr("DESTINATION_RECEIVER_FUND", uint256(0.01 ether));
        address proofObserveRecipient = vm.envOr("STRATEGY_PROOF_OBSERVE_RECIPIENT", address(0));
        address proofHedgeRecipient = vm.envOr("STRATEGY_PROOF_HEDGE_RECIPIENT", address(0));
        address proofGridRecipient = vm.envOr("STRATEGY_PROOF_GRID_RECIPIENT", address(0));
        address proofPausedRecipient = vm.envOr("STRATEGY_PROOF_PAUSED_RECIPIENT", address(0));
        uint256 proofObserve = vm.envOr("STRATEGY_PROOF_OBSERVE", uint256(0));
        uint256 proofHedge = vm.envOr("STRATEGY_PROOF_HEDGE", uint256(0));
        uint256 proofGrid = vm.envOr("STRATEGY_PROOF_GRID", uint256(0));
        uint256 proofPaused = vm.envOr("STRATEGY_PROOF_PAUSED", uint256(0));

        vm.startBroadcast(privateKey);
        vault = new WhaleDataVault(owner);
        executor = new StrategyExecutor(owner);
        receiver = new WhaleCallbackReceiver{value: receiverFund}(owner, callbackSender, address(vault), address(executor));
        account = new MinimalSmartAccount(owner);

        vault.setWriter(address(receiver), true);
        executor.setOperator(address(receiver), true);
        executor.setSmartAccount(address(account));
        account.setExecutor(address(executor), true);

        if (proofObserveRecipient != address(0)) {
            executor.setProofRecipient(StrategyExecutor.Mode.Observe, proofObserveRecipient);
        }
        if (proofHedgeRecipient != address(0)) {
            executor.setProofRecipient(StrategyExecutor.Mode.Hedge, proofHedgeRecipient);
        }
        if (proofGridRecipient != address(0)) {
            executor.setProofRecipient(StrategyExecutor.Mode.Grid, proofGridRecipient);
        }
        if (proofPausedRecipient != address(0)) {
            executor.setProofRecipient(StrategyExecutor.Mode.Paused, proofPausedRecipient);
        }
        if (proofObserve > 0) {
            executor.setProofAmount(StrategyExecutor.Mode.Observe, proofObserve);
        }
        if (proofHedge > 0) {
            executor.setProofAmount(StrategyExecutor.Mode.Hedge, proofHedge);
        }
        if (proofGrid > 0) {
            executor.setProofAmount(StrategyExecutor.Mode.Grid, proofGrid);
        }
        if (proofPaused > 0) {
            executor.setProofAmount(StrategyExecutor.Mode.Paused, proofPaused);
        }
        vm.stopBroadcast();
    }
}
