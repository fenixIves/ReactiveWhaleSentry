// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {MockWhaleEmitter} from "../src/origin/MockWhaleEmitter.sol";

contract DeployOriginScript is Script {
    function run() external returns (MockWhaleEmitter emitter) {
        vm.startBroadcast();
        emitter = new MockWhaleEmitter();
        vm.stopBroadcast();
    }
}
