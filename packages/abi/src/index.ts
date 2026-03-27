export * from "./addresses";

export const whaleDataVaultAbi = [
  {
    type: "function",
    stateMutability: "view",
    name: "getRecordCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }]
  },
  {
    type: "function",
    stateMutability: "view",
    name: "getRecord",
    inputs: [{ name: "index", type: "uint256", internalType: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct WhaleDataVault.WhaleRecord",
        components: [
          { name: "whale", type: "address", internalType: "address" },
          { name: "chainId", type: "uint256", internalType: "uint256" },
          { name: "amount", type: "uint256", internalType: "uint256" },
          { name: "timestamp", type: "uint256", internalType: "uint256" },
          { name: "pnl", type: "int256", internalType: "int256" },
          { name: "strategyTag", type: "bytes32", internalType: "bytes32" }
        ]
      }
    ]
  }
] as const;

export const strategyExecutorAbi = [
  {
    type: "function",
    stateMutability: "view",
    name: "currentMode",
    inputs: [],
    outputs: [{ name: "", type: "uint8", internalType: "enum StrategyExecutor.Mode" }]
  },
  {
    type: "function",
    stateMutability: "view",
    name: "getExecutionCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }]
  },
  {
    type: "function",
    stateMutability: "view",
    name: "getExecution",
    inputs: [{ name: "index", type: "uint256", internalType: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct StrategyExecutor.ExecutionRecord",
        components: [
          { name: "whale", type: "address", internalType: "address" },
          { name: "amount", type: "uint256", internalType: "uint256" },
          { name: "timestamp", type: "uint256", internalType: "uint256" },
          { name: "mode", type: "uint8", internalType: "enum StrategyExecutor.Mode" },
          { name: "reason", type: "bytes32", internalType: "bytes32" }
        ]
      }
    ]
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "execute",
    inputs: [
      { name: "whale", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "pnl", type: "int256", internalType: "int256" },
      { name: "reason", type: "bytes32", internalType: "bytes32" }
    ],
    outputs: []
  }
] as const;

export const strategyExecutorEventsAbi = [
  {
    type: "event",
    name: "StrategyExecuted",
    inputs: [
      { name: "whale", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "mode", type: "uint8", indexed: false },
      { name: "reason", type: "bytes32", indexed: true }
    ]
  },
  {
    type: "event",
    name: "ProofSent",
    inputs: [
      { name: "recipient", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "mode", type: "uint8", indexed: false }
    ]
  },
  {
    type: "event",
    name: "ProofFailed",
    inputs: [
      { name: "recipient", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "mode", type: "uint8", indexed: false }
    ]
  }
] as const;

export const mockWhaleEmitterAbi = [
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "emitMockTrade",
    inputs: [
      { name: "whale", type: "address", internalType: "address" },
      { name: "sourceChainId", type: "uint256", internalType: "uint256" },
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "pnl", type: "int256", internalType: "int256" },
      { name: "strategyTag", type: "bytes32", internalType: "bytes32" }
    ],
    outputs: []
  }
] as const;

export const minimalSmartAccountAbi = [
  {
    type: "function",
    stateMutability: "view",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }]
  }
] as const;
