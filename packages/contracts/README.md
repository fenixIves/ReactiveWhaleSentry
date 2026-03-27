# Smart Whale Sentinel Contracts

This package contains the full on-chain backend for the Smart Whale Sentinel hackathon project.

## Quick Map (What Each File Does)

### Origin (Base Sepolia)
- `src/origin/MockWhaleEmitter.sol`  
  Emits `WhaleTradeDetected(...)` events to simulate whale activity on the origin chain.

### Reactive (Lasna)
- `src/reactive/WhaleReactiveContract.sol`  
  Subscribes to origin events and emits Reactive `Callback` to the destination chain.  
  Requires a subscription on the Reactive system contract and sufficient balance to cover execution debt.

### Destination (Base Sepolia)
- `src/destination/WhaleCallbackReceiver.sol`  
  Receives Reactive callbacks (only from the official callback proxy), validates sender, writes to vault, and triggers strategy updates.
- `src/destination/WhaleDataVault.sol`  
  Stores whale records on-chain.
- `src/destination/StrategyExecutor.sol`  
  Updates current strategy mode and execution history.
- `src/destination/MinimalSmartAccount.sol`  
  Minimal account-style execution surface.

### Support / Mock
- `src/WhaleReactiveListener.sol`  
  Mock-only listener that simulates the Reactive callback stage for local tests or fallback demos.

## Deployment Overview (Why Each Step)

1) **Origin** emits events.  
2) **Reactive** subscribes to those events and emits a callback.  
3) **Destination** receives the callback, stores data, updates strategy state.  

You must deploy in this order because each step requires addresses from the previous step(s).

## Architecture

The project is split into three explicit layers required by the hackathon rules.

### 1. Origin Contract

- `src/origin/MockWhaleEmitter.sol`
- Deployed on the origin chain
- Emits `WhaleTradeDetected(...)` events that simulate whale activity

### 2. Reactive Contract

- `src/reactive/WhaleReactiveContract.sol`
- Deployed on Reactive Network
- Uses the official `reactive-lib`
- Subscribes to origin events and emits a Reactive callback payload to the destination chain

### 3. Destination Contracts

- `src/destination/WhaleCallbackReceiver.sol`
- `src/destination/WhaleDataVault.sol`
- `src/destination/StrategyExecutor.sol`
- `src/destination/MinimalSmartAccount.sol`

The callback receiver accepts authorized Reactive callbacks, stores whale records on-chain, and updates the strategy state. The frontend reads this chain state directly.

## Why Reactive Contracts Matter

Without Reactive Contracts, this system would need a centralized backend or trading bot to:

1. constantly watch origin chain whale events,
2. decode the event data,
3. decide whether strategy state should change,
4. submit a follow-up transaction to the destination chain.

That approach introduces trust, uptime, and operator risk.

Reactive Contracts remove that centralized listener layer. The origin event itself becomes the trigger, the Reactive contract performs the on-chain routing logic, and the destination contracts store and execute the result in a verifiable on-chain flow.

## Environment Variables

Create a `.env` file for deployment.

```bash
ORIGIN_RPC=https://sepolia.base.org
ORIGIN_CHAIN_ID=84532
ORIGIN_PRIVATE_KEY=

DESTINATION_RPC=https://sepolia.base.org
DESTINATION_CHAIN_ID=84532
DESTINATION_PRIVATE_KEY=
DESTINATION_CALLBACK_PROXY_ADDR=0xa6eA49Ed671B8a4dfCDd34E36b7a75Ac79B8A5a6
DESTINATION_RECEIVER_FUND=10000000000000000

REACTIVE_RPC=https://lasna-rpc.rnk.dev/
REACTIVE_PRIVATE_KEY=
SYSTEM_CONTRACT_ADDR=0x0000000000000000000000000000000000fffFfF

# Reactive deployment funding (optional override)
REACTIVE_DEPLOY_VALUE=20000000000000000
```

### Notes

- In the current demo flow, both origin and destination use Base Sepolia.
- `DESTINATION_CALLBACK_PROXY_ADDR` must be the official callback proxy for the destination chain.
- `DESTINATION_RECEIVER_FUND` pre-funds the callback receiver to pay for callback execution. This avoids `PaymentFailure` and blacklisting.
- `SYSTEM_CONTRACT_ADDR` is the Reactive system contract on Lasna.
- The Reactive deployment wallet must have enough Reactive-side balance to support subscriptions and callbacks.

## Important Event Topic

The Reactive contract subscribes to this origin event signature:

```solidity
WhaleTradeDetected(address,uint256,uint256,uint256,int256,bytes32)
```

You can compute the topic with:

```bash
cast keccak "WhaleTradeDetected(address,uint256,uint256,uint256,int256,bytes32)"
```

Export it before deploying the Reactive contract:

```bash
export WHALE_TOPIC0=$(cast keccak "WhaleTradeDetected(address,uint256,uint256,uint256,int256,bytes32)")
```

## Deployment Order

Run deployments in this exact order.

### 1. Deploy Origin Contract

```bash
source .env
forge script script/DeployOrigin.s.sol:DeployOriginScript \
  --rpc-url $ORIGIN_RPC \
  --private-key $ORIGIN_PRIVATE_KEY \
  --broadcast
```

Save the deployed `MockWhaleEmitter` address as:

```bash
export ORIGIN_EMITTER=<deployed_origin_emitter>
```

Expected output: a `contractAddress` for `MockWhaleEmitter` in the broadcast JSON.

### 2. Deploy Destination Contracts

```bash
source .env
forge script script/DeployDestination.s.sol:DeployDestinationScript \
  --rpc-url $DESTINATION_RPC \
  --private-key $DESTINATION_PRIVATE_KEY \
  --broadcast
```

Save these deployed addresses:

```bash
export WHALE_DATA_VAULT=<vault_address>
export STRATEGY_EXECUTOR=<executor_address>
export WHALE_CALLBACK_RECEIVER=<receiver_address>
export SMART_ACCOUNT=<smart_account_address>
```

Expected output: 4 contract addresses in the broadcast JSON plus 2 config calls:
`setWriter` and `setOperator`.

### 3. Deploy Reactive Contract

Before this step, export the addresses from the first two deployments:

```bash
export ORIGIN_EMITTER=<deployed_origin_emitter>
export CALLBACK_RECEIVER=<deployed_callback_receiver>
export WHALE_TOPIC0=$(cast keccak "WhaleTradeDetected(address,uint256,uint256,uint256,int256,bytes32)")
```

Then deploy:

```bash
source .env
forge script script/DeployReactive.s.sol:DeployReactiveScript \
  --rpc-url $REACTIVE_RPC \
  --private-key $REACTIVE_PRIVATE_KEY \
  --broadcast
```

Save the deployed address as:

```bash
export WHALE_REACTIVE_CONTRACT=<reactive_contract_address>
```

Expected output: `WhaleReactiveContract` contract address in the broadcast JSON.

### 4. Subscribe Reactive Contract (Required)

Reactive contract must subscribe to the origin event on Lasna.

```bash
cast send $WHALE_REACTIVE_CONTRACT "subscribe()" \
  --rpc-url $REACTIVE_RPC \
  --private-key $REACTIVE_PRIVATE_KEY
```

Expected output: system contract `Subscribe` event and `SubscriptionRequested` event.

### 5. Bind Destination Receiver to Reactive (Required)

```bash
cast send $WHALE_CALLBACK_RECEIVER "setExpectedReactive(address)" $WHALE_REACTIVE_CONTRACT \
  --rpc-url $DESTINATION_RPC \
  --private-key $DESTINATION_PRIVATE_KEY
```

Expected output: `ExpectedReactiveUpdated` event on the receiver.

### 6. Understand `expectedReactive` (Why It Matters)

`expectedReactive` is an allowlist in `WhaleCallbackReceiver`. When set to a non-zero address, the receiver
will only accept callbacks where `reactiveSender` matches that address. This prevents spoofed callbacks.

- During normal operation: set it to your deployed `WhaleReactiveContract`.
- For debugging only: you can temporarily set it to `0x0` to accept any reactive sender.

## Funding Note For Reactive Deployment

If the Reactive contract needs additional balance for callback execution, fund it according to the Reactive Network docs and system contract flow before expecting live callbacks to succeed.

You can check and cover Reactive debt:

```bash
cast call $SYSTEM_CONTRACT_ADDR "debt(address)" $WHALE_REACTIVE_CONTRACT --rpc-url $REACTIVE_RPC
cast send $WHALE_REACTIVE_CONTRACT "coverDebt()" --rpc-url $REACTIVE_RPC --private-key $REACTIVE_PRIVATE_KEY
```

## Funding Note For Destination Receiver (Critical)

The callback proxy charges the destination receiver contract for executing callbacks. If the receiver has
no ETH, you may see `PaymentFailure`/`CallbackFailure` and the receiver can be blacklisted by the proxy.

To prevent this, pre-fund the receiver on deployment:

```bash
DESTINATION_RECEIVER_FUND=10000000000000000
```

This sends 0.01 ETH to the receiver at deployment time.

## Simulating Whale Events

After origin deployment, you can emit a mock whale event:

```bash
export MOCK_WHALE=<wallet_address>
export MOCK_SOURCE_CHAIN_ID=84532
export MOCK_AMOUNT=1000000000000000000000
export MOCK_PNL=5000000000000000000
export MOCK_STRATEGY_TAG=0x7768616c652d6275790000000000000000000000000000000000000000000000

forge script script/SimulateOriginEvent.s.sol:SimulateOriginEventScript \
  --rpc-url $ORIGIN_RPC \
  --private-key $ORIGIN_PRIVATE_KEY \
  --broadcast
```

Expected output: `WhaleTradeDetected` log on the origin chain.

## Frontend Address Sync

After deployment, copy the resulting addresses into frontend env values:

```bash
NEXT_PUBLIC_RPC_URL=$DESTINATION_RPC
NEXT_PUBLIC_CHAIN_ID=$DESTINATION_CHAIN_ID
NEXT_PUBLIC_WHALE_DATA_VAULT=$WHALE_DATA_VAULT
NEXT_PUBLIC_STRATEGY_EXECUTOR=$STRATEGY_EXECUTOR
NEXT_PUBLIC_SMART_ACCOUNT=$SMART_ACCOUNT
NEXT_PUBLIC_WHALE_CALLBACK_RECEIVER=$WHALE_CALLBACK_RECEIVER
NEXT_PUBLIC_WHALE_REACTIVE_CONTRACT=$WHALE_REACTIVE_CONTRACT
NEXT_PUBLIC_ORIGIN_EMITTER=$ORIGIN_EMITTER
```

You can also update `packages/abi/src/addresses.ts` or run the root helper script if you prefer to sync addresses through shared exports.

## Local Validation

Compile and test locally:

```bash
forge build
forge test -vv
```

## Expected On-Chain Outputs

- Origin: `WhaleTradeDetected(...)` event emitted.
- Reactive (Lasna): `ReactiveLogAccepted(...)` and `Callback(...)` events.
- Destination: `WhaleSignalHandled(...)`, plus updated `WhaleDataVault` records and `StrategyExecutor` execution count.

## Troubleshooting

### No data on destination (recordCount/executionCount stay 0)
Checklist:
1) Confirm `subscribe()` was called successfully on the Reactive contract.
2) Confirm `setExpectedReactive(...)` is set to the Reactive contract address.
3) Confirm callback proxy address is correct for the destination chain.
4) Check Reactive debt:
   ```bash
   cast call $SYSTEM_CONTRACT_ADDR "debt(address)" $WHALE_REACTIVE_CONTRACT --rpc-url $REACTIVE_RPC
   ```
   If non-zero, fund and call `coverDebt()`.
5) If Reactive emits `Callback` but destination has no txs, the callback executor may be delayed or unavailable.

### CallbackFailure / PaymentFailure on Destination
This usually means the receiver has insufficient ETH to pay the callback proxy.
Fix by funding the receiver or redeploying with `DESTINATION_RECEIVER_FUND`.

## Contract Files

### Origin

- `src/origin/MockWhaleEmitter.sol`

### Reactive

- `src/reactive/WhaleReactiveContract.sol`

### Destination

- `src/destination/WhaleCallbackReceiver.sol`
- `src/destination/WhaleDataVault.sol`
- `src/destination/StrategyExecutor.sol`
- `src/destination/MinimalSmartAccount.sol`

## Deployment Scripts

- `script/DeployOrigin.s.sol`
- `script/DeployDestination.s.sol`
- `script/DeployReactive.s.sol`
- `script/SimulateOriginEvent.s.sol`
