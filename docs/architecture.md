# Architecture

## Flow

1. `MockWhaleEmitter` emits mock whale trade events.
2. `WhaleReactiveListener` simulates the Reactive callback stage.
3. `WhaleDataVault` stores records on-chain.
4. `StrategyExecutor` updates the current strategy mode and execution history.
5. `MinimalSmartAccount` is the minimal AA-style execution surface.
6. `apps/web` reads chain state and renders the dashboard.
