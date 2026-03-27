// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {WhaleReactiveContract} from "../src/reactive/WhaleReactiveContract.sol";

contract DeployReactiveScript is Script {
    function _privateKey() internal view returns (uint256) {
        string memory raw = vm.envString("REACTIVE_PRIVATE_KEY");
        bytes memory b = bytes(raw);
        if (b.length >= 2 && b[0] == "0" && (b[1] == "x" || b[1] == "X")) {
            return vm.parseUint(raw);
        }
        return vm.parseUint(string.concat("0x", raw));
    }

    function run() external returns (WhaleReactiveContract reactiveContract) {
        uint256 originChainId = vm.envUint("ORIGIN_CHAIN_ID");
        uint256 destinationChainId = vm.envUint("DESTINATION_CHAIN_ID");
        address originEmitter = vm.envAddress("ORIGIN_EMITTER");
        address callbackReceiver = vm.envAddress("CALLBACK_RECEIVER");
        uint256 whaleTopic0 = vm.envUint("WHALE_TOPIC0");
        uint256 privateKey = _privateKey();
        uint256 deployValue = vm.envOr("REACTIVE_DEPLOY_VALUE", uint256(0.02 ether));

        vm.startBroadcast(privateKey);
        reactiveContract = new WhaleReactiveContract{value: deployValue}(
            originChainId,
            destinationChainId,
            originEmitter,
            whaleTopic0,
            callbackReceiver
        );
        vm.stopBroadcast();
    }
}
