// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {MockWhaleEmitter} from "../src/origin/MockWhaleEmitter.sol";

contract SimulateOriginEventScript is Script {
    function run() external {
        address emitterAddress = vm.envAddress("ORIGIN_EMITTER");
        address whale = vm.envAddress("MOCK_WHALE");
        uint256 sourceChainId = vm.envUint("MOCK_SOURCE_CHAIN_ID");
        uint256 amount = vm.envUint("MOCK_AMOUNT");
        int256 pnl = int256(vm.envInt("MOCK_PNL"));
        bytes32 strategyTag = vm.envBytes32("MOCK_STRATEGY_TAG");

        vm.startBroadcast();
        MockWhaleEmitter(emitterAddress).emitMockTrade(whale, sourceChainId, amount, pnl, strategyTag);
        vm.stopBroadcast();
    }
}
