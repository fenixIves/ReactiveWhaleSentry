# 智能鲸鱼哨兵合约

此包包含智能鲸鱼哨兵黑客马拉松项目的完整链上后端。

## 快速映射（每个文件的作用）

### 源链（Base Sepolia）
- `src/origin/MockWhaleEmitter.sol`  
  发出 `WhaleTradeDetected(...)` 事件来模拟源链上的鲸鱼活动。

### 反应链（Lasna）
- `src/reactive/WhaleReactiveContract.sol`  
  订阅源链事件并向目标链发出反应式 `Callback`。  
  需要在反应式系统合约上订阅并有足够余额来覆盖执行债务。

### 目标链（Base Sepolia）
- `src/destination/WhaleCallbackReceiver.sol`  
  接收反应式回调（仅来自官方回调代理），验证发送者，写入金库，并触发策略更新。
- `src/destination/WhaleDataVault.sol`  
  在链上存储鲸鱼记录。
- `src/destination/StrategyExecutor.sol`  
  更新当前策略模式和执行历史。
- `src/destination/MinimalSmartAccount.sol`  
  最小账户风格执行界面。

### 支持 / 模拟
- `src/WhaleReactiveListener.sol`  
  仅模拟监听器，为本地测试或回退演示模拟反应式回调阶段。

## 部署概述（为什么需要每个步骤）

1) **源链** 发出事件。  
2) **反应链** 订阅这些事件并发出回调。  
3) **目标链** 接收回调，存储数据，更新策略状态。  

你必须按此顺序部署，因为每个步骤都需要前一步骤的地址。

## 架构

项目按照黑客马拉松规则分为三个明确的层。

### 1. 源链合约

- `src/origin/MockWhaleEmitter.sol`
- 部署在源链上
- 发出模拟鲸鱼活动的 `WhaleTradeDetected(...)` 事件

### 2. 反应式合约

- `src/reactive/WhaleReactiveContract.sol`
- 部署在反应式网络上
- 使用官方的 `reactive-lib`
- 订阅源链事件并向目标链发出反应式回调负载

### 3. 目标链合约

- `src/destination/WhaleCallbackReceiver.sol`
- `src/destination/WhaleDataVault.sol`
- `src/destination/StrategyExecutor.sol`
- `src/destination/MinimalSmartAccount.sol`

回调接收器接受授权的反应式回调，在链上存储鲸鱼记录，并更新策略状态。前端直接读取此链状态。

## 为什么反应式合约很重要

没有反应式合约，此系统将需要中心化后端或交易机器人来：

1. 持续监控源链鲸鱼事件，
2. 解码事件数据，
3. 决定策略状态是否应该改变，
4. 向目标链提交后续交易。

这种方法引入了信任、正常运行时间和操作者风险。

反应式合约移除了中心化监听层。源链事件本身成为触发器，反应式合约执行链上路由逻辑，目标链合约以可验证的链上流程存储和执行结果。

## 环境变量

为部署创建 `.env` 文件。

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

# 反应式部署资金（可选覆盖）
REACTIVE_DEPLOY_VALUE=20000000000000000
```

### 注意事项

- 在当前的演示流程中，源链和目标链都使用 Base Sepolia。
- `DESTINATION_CALLBACK_PROXY_ADDR` 必须是目标链的官方回调代理。
- `DESTINATION_RECEIVER_FUND` 预先为回调接收器提供资金以支付回调执行费用。这可以避免 `PaymentFailure` 和黑名单。
- `SYSTEM_CONTRACT_ADDR` 是 Lasna 上的反应式系统合约。
- 反应式部署钱包必须有足够的反应式链余额来支持订阅和回调。

## 重要事件主题

反应式合约订阅此源链事件签名：

```solidity
WhaleTradeDetected(address,uint256,uint256,uint256,int256,bytes32)
```

你可以使用以下命令计算主题：

```bash
cast keccak "WhaleTradeDetected(address,uint256,uint256,uint256,int256,bytes32)"
```

在部署反应式合约之前导出它：

```bash
export WHALE_TOPIC0=$(cast keccak "WhaleTradeDetected(address,uint256,uint256,uint256,int256,bytes32)")
```

## 部署顺序

按此确切顺序运行部署。

### 1. 部署源链合约

```bash
source .env
forge script script/DeployOrigin.s.sol:DeployOriginScript \
  --rpc-url $ORIGIN_RPC \
  --private-key $ORIGIN_PRIVATE_KEY \
  --broadcast
```

将部署的 `MockWhaleEmitter` 地址保存为：

```bash
export ORIGIN_EMITTER=<deployed_origin_emitter>
```

预期输出：broadcast JSON 中的 `MockWhaleEmitter` 的 `contractAddress`。

### 2. 部署目标链合约

```bash
source .env
forge script script/DeployDestination.s.sol:DeployDestinationScript \
  --rpc-url $DESTINATION_RPC \
  --private-key $DESTINATION_PRIVATE_KEY \
  --broadcast
```

保存这些部署的地址：

```bash
export WHALE_DATA_VAULT=<vault_address>
export STRATEGY_EXECUTOR=<executor_address>
export WHALE_CALLBACK_RECEIVER=<receiver_address>
export SMART_ACCOUNT=<smart_account_address>
```

预期输出：broadcast JSON 中的 4 个合约地址加上 2 个配置调用：
`setWriter` 和 `setOperator`。

### 3. 部署反应式合约

在此步骤之前，导出前两次部署的地址：

```bash
export ORIGIN_EMITTER=<deployed_origin_emitter>
export CALLBACK_RECEIVER=<deployed_callback_receiver>
export WHALE_TOPIC0=$(cast keccak "WhaleTradeDetected(address,uint256,uint256,uint256,int256,bytes32)")
```

然后部署：

```bash
source .env
forge script script/DeployReactive.s.sol:DeployReactiveScript \
  --rpc-url $REACTIVE_RPC \
  --private-key $REACTIVE_PRIVATE_KEY \
  --broadcast
```

将部署的地址保存为：

```bash
export WHALE_REACTIVE_CONTRACT=<reactive_contract_address>
```

预期输出：broadcast JSON 中的 `WhaleReactiveContract` 合约地址。

### 4. 订阅反应式合约（必需）

反应式合约必须在 Lasna 上订阅源链事件。

```bash
cast send $WHALE_REACTIVE_CONTRACT "subscribe()" \
  --rpc-url $REACTIVE_RPC \
  --private-key $REACTIVE_PRIVATE_KEY
```

预期输出：系统合约的 `Subscribe` 事件和 `SubscriptionRequested` 事件。

### 5. 将目标链接收器绑定到反应式合约（必需）

```bash
cast send $WHALE_CALLBACK_RECEIVER "setExpectedReactive(address)" $WHALE_REACTIVE_CONTRACT \
  --rpc-url $DESTINATION_RPC \
  --private-key $DESTINATION_PRIVATE_KEY
```

预期输出：接收器上的 `ExpectedReactiveUpdated` 事件。

### 6. 理解 `expectedReactive`（为什么重要）

`expectedReactive` 是 `WhaleCallbackReceiver` 中的一个允许列表。当设置为非零地址时，接收器将只接受 `reactiveSender` 与该地址匹配的回调。这可以防止伪造的回调。

- 正常操作期间：将其设置为你部署的 `WhaleReactiveContract`。
- 仅用于调试：你可以临时将其设置为 `0x0` 以接受任何反应式发送者。

## 反应式部署资金注意事项

如果反应式合约需要额外余额进行回调执行，请根据反应式网络文档和系统合约流程为其提供资金，然后再期望实时回调成功。

你可以检查和覆盖反应式债务：

```bash
cast call $SYSTEM_CONTRACT_ADDR "debt(address)" $WHALE_REACTIVE_CONTRACT --rpc-url $REACTIVE_RPC
cast send $WHALE_REACTIVE_CONTRACT "coverDebt()" --rpc-url $REACTIVE_RPC --private-key $REACTIVE_PRIVATE_KEY
```

## 目标链接收器资金注意事项（关键）

回调代理向目标链接收器合约收取执行回调的费用。如果接收器没有 ETH，你可能会看到 `PaymentFailure`/`CallbackFailure`，并且接收器可能被代理列入黑名单。

为防止这种情况，在部署时预先为接收器提供资金：

```bash
DESTINATION_RECEIVER_FUND=10000000000000000
```

这会在部署时向接收器发送 0.01 ETH。

## 模拟鲸鱼事件

源链部署后，你可以发出模拟鲸鱼事件：

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

预期输出：源链上的 `WhaleTradeDetected` 日志。

## 前端地址同步

部署后，将结果地址复制到前端环境变量中：

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

你也可以更新 `packages/abi/src/addresses.ts` 或运行根目录辅助脚本，如果你更喜欢通过共享导出来同步地址。

## 本地验证

本地编译和测试：

```bash
forge build
forge test -vv
```

## 预期链上输出

- 源链：发出 `WhaleTradeDetected(...)` 事件。
- 反应式链（Lasna）：`ReactiveLogAccepted(...)` 和 `Callback(...)` 事件。
- 目标链：`WhaleSignalHandled(...)`，以及更新的 `WhaleDataVault` 记录和 `StrategyExecutor` 执行计数。

## 故障排除

### 目标链上没有数据（recordCount/executionCount 保持为 0）
检查清单：
1) 确认在反应式合约上成功调用了 `subscribe()`。
2) 确认 `setExpectedReactive(...)` 设置为反应式合约地址。
3) 确认回调代理地址对于目标链是正确的。
4) 检查反应式债务：
   ```bash
   cast call $SYSTEM_CONTRACT_ADDR "debt(address)" $WHALE_REACTIVE_CONTRACT --rpc-url $REACTIVE_RPC
   ```
   如果非零，提供资金并调用 `coverDebt()`。
5) 如果反应式发出 `Callback` 但目标链没有交易，回调执行器可能延迟或不可用。

### 目标链上的 CallbackFailure / PaymentFailure
这通常意味着接收器没有足够的 ETH 来支付回调代理。
通过为接收器提供资金或使用 `DESTINATION_RECEIVER_FUND` 重新部署来修复。

## 合约文件

### 源链

- `src/origin/MockWhaleEmitter.sol`

### 反应式

- `src/reactive/WhaleReactiveContract.sol`

### 目标链

- `src/destination/WhaleCallbackReceiver.sol`
- `src/destination/WhaleDataVault.sol`
- `src/destination/StrategyExecutor.sol`
- `src/destination/MinimalSmartAccount.sol`

## 部署脚本

- `script/DeployOrigin.s.sol`
- `script/DeployDestination.s.sol`
- `script/DeployReactive.s.sol`
- `script/SimulateOriginEvent.s.sol`
