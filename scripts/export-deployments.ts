import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";

// Load environment variables from .env file
config();

const outputPath = resolve(process.cwd(), "packages/abi/src/addresses.ts");

const addresses = {
  whaleDataVault: process.env.NEXT_PUBLIC_WHALE_DATA_VAULT ?? process.env.WHALE_DATA_VAULT ?? "0x0000000000000000000000000000000000000000",
  strategyExecutor: process.env.NEXT_PUBLIC_STRATEGY_EXECUTOR ?? process.env.STRATEGY_EXECUTOR ?? "0x0000000000000000000000000000000000000000",
  smartAccount: process.env.NEXT_PUBLIC_SMART_ACCOUNT ?? process.env.SMART_ACCOUNT ?? "0x0000000000000000000000000000000000000000",
  whaleCallbackReceiver: process.env.NEXT_PUBLIC_WHALE_CALLBACK_RECEIVER ?? process.env.WHALE_CALLBACK_RECEIVER ?? "0x0000000000000000000000000000000000000000",
  whaleReactiveContract: process.env.NEXT_PUBLIC_WHALE_REACTIVE_CONTRACT ?? process.env.WHALE_REACTIVE_CONTRACT ?? "0x0000000000000000000000000000000000000000",
  originEmitter: process.env.NEXT_PUBLIC_ORIGIN_EMITTER ?? process.env.ORIGIN_EMITTER ?? "0x0000000000000000000000000000000000000000"
};

writeFileSync(
  outputPath,
  `export const deployedAddresses = ${JSON.stringify(addresses, null, 2)} as const;\n`
);
