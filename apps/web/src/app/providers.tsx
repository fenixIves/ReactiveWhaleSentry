"use client";

import { appConfig } from "@hackathon/config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { useState } from "react";
import { WagmiProvider, http } from "wagmi";
import { defineChain } from "viem";

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? appConfig.defaultChainId);
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL ?? appConfig.rpcUrl;

const hackathonChain = defineChain({
  id: chainId,
  name: "Hackathon",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [rpcUrl]
    }
  }
});

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "YOUR_PROJECT_ID";

const wagmiConfig = getDefaultConfig({
  appName: appConfig.appName,
  projectId: walletConnectProjectId,
  chains: [hackathonChain],
  transports: {
    [hackathonChain.id]: http(rpcUrl)
  },
  ssr: true
});

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
