// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {MinimalSmartAccount} from "./MinimalSmartAccount.sol";

contract StrategyExecutor {
    enum Mode {
        Observe,
        Hedge,
        Grid,
        Paused
    }

    struct ExecutionRecord {
        address whale;
        uint256 amount;
        uint256 timestamp;
        Mode mode;
        bytes32 reason;
    }

    event OperatorUpdated(address indexed operator, bool allowed);
    event StrategyExecuted(address indexed whale, uint256 amount, Mode mode, bytes32 indexed reason);
    event SmartAccountUpdated(address indexed smartAccount);
    event ProofRecipientUpdated(Mode indexed mode, address indexed recipient);
    event ProofAmountUpdated(Mode indexed mode, uint256 amount);
    event ProofSent(address indexed recipient, uint256 amount, Mode mode);
    event ProofFailed(address indexed recipient, uint256 amount, Mode mode);

    address public owner;
    ExecutionRecord[] private executions;
    mapping(address => bool) public operators;
    Mode public currentMode = Mode.Observe;
    MinimalSmartAccount public smartAccount;
    mapping(uint8 => address) public proofRecipients;
    mapping(uint8 => uint256) public proofAmounts;

    constructor(address owner_) {
        owner = owner_;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "owner only");
        _;
    }

    modifier onlyOperator() {
        require(operators[msg.sender], "operator only");
        _;
    }

    function setOperator(address operator, bool allowed) external onlyOwner {
        operators[operator] = allowed;
        emit OperatorUpdated(operator, allowed);
    }

    function setSmartAccount(address smartAccount_) external onlyOwner {
        smartAccount = MinimalSmartAccount(payable(smartAccount_));
        emit SmartAccountUpdated(smartAccount_);
    }

    function setProofRecipient(Mode mode, address recipient) external onlyOwner {
        proofRecipients[uint8(mode)] = recipient;
        emit ProofRecipientUpdated(mode, recipient);
    }

    function setProofAmount(Mode mode, uint256 amount) external onlyOwner {
        proofAmounts[uint8(mode)] = amount;
        emit ProofAmountUpdated(mode, amount);
    }

    function execute(address whale, uint256 amount, int256 pnl, bytes32 reason) external onlyOperator {
        if (amount > 0 ether) {
            currentMode = Mode.Hedge;
        } else if (pnl < 0) {
            currentMode = Mode.Grid;
        } else {
            currentMode = Mode.Observe;
        }

        executions.push(ExecutionRecord(whale, amount, block.timestamp, currentMode, reason));
        emit StrategyExecuted(whale, amount, currentMode, reason);

        _sendProof(currentMode);
    }

    function getExecutionCount() external view returns (uint256) {
        return executions.length;
    }

    function getExecution(uint256 index) external view returns (ExecutionRecord memory) {
        return executions[index];
    }

    function _sendProof(Mode mode) internal {
        address recipient = proofRecipients[uint8(mode)];
        uint256 proofAmount = proofAmounts[uint8(mode)];
        if (address(smartAccount) == address(0) || recipient == address(0) || proofAmount == 0) {
            return;
        }
        try smartAccount.execute(recipient, proofAmount, "") {
            emit ProofSent(recipient, proofAmount, mode);
        } catch {
            emit ProofFailed(recipient, proofAmount, mode);
        }
    }
}
