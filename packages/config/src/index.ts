export const appConfig = {
  appName: "Smart Whale Sentinel",
  defaultChainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 31337),
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8545"
};
