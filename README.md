# Reactive DApp Hackathon

Monorepo for the Smart Whale Sentinel hackathon project.

## Apps

- `apps/web`: Next.js dashboard frontend
- `packages/contracts`: Foundry smart contracts and scripts
- `packages/abi`: Shared ABI and deployed address exports
- `packages/config`: Shared frontend chain configuration

## Quick Start

```bash
pnpm install
pnpm dev
```

For contracts:

```bash
cd packages/contracts
forge build
forge test
```
