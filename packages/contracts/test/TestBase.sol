// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract TestBase {
    error AssertionFailed(string message);

    function assertEq(uint256 a, uint256 b, string memory message) internal pure {
        if (a != b) revert AssertionFailed(message);
    }

    function assertEq(address a, address b, string memory message) internal pure {
        if (a != b) revert AssertionFailed(message);
    }

    function assertEq(int256 a, int256 b, string memory message) internal pure {
        if (a != b) revert AssertionFailed(message);
    }

    function assertTrue(bool condition, string memory message) internal pure {
        if (!condition) revert AssertionFailed(message);
    }
}
