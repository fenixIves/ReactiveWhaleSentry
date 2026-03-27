"use client";

import { strategyExecutorAbi, whaleDataVaultAbi } from "@hackathon/abi";
import { useEffect, useMemo, useState } from "react";
import { createPublicClient, http } from "viem";

const modeLabels = ["OBSERVE", "HEDGE", "GRID", "PAUSED"] as const;

type LiveMetricsProps = {
  rpcUrl: string;
  chainId: number;
  whaleDataVault: string;
  strategyExecutor: string;
  initial: {
    recordCount: string;
    executionCount: string;
    mode: string;
    latestChainId: string | null;
    connected: boolean;
  };
};

export default function LiveMetrics({ rpcUrl, chainId, whaleDataVault, strategyExecutor, initial }: LiveMetricsProps) {
  const [state, setState] = useState(initial);

  const client = useMemo(
    () =>
      createPublicClient({
        chain: {
          id: chainId,
          name: "hackathon-local",
          nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
          rpcUrls: { default: { http: [rpcUrl] } }
        },
        transport: http(rpcUrl)
      }),
    [chainId, rpcUrl]
  );

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const [recordCount, executionCount, mode] = await Promise.all([
          client.readContract({
            address: whaleDataVault as `0x${string}`,
            abi: whaleDataVaultAbi,
            functionName: "getRecordCount"
          }),
          client.readContract({
            address: strategyExecutor as `0x${string}`,
            abi: strategyExecutorAbi,
            functionName: "getExecutionCount"
          }),
          client.readContract({
            address: strategyExecutor as `0x${string}`,
            abi: strategyExecutorAbi,
            functionName: "currentMode"
          })
        ]);

        let latestChainId: string | null = null;
        if (recordCount > 0n) {
          const record = await client.readContract({
            address: whaleDataVault as `0x${string}`,
            abi: whaleDataVaultAbi,
            functionName: "getRecord",
            args: [recordCount - 1n]
          });
          latestChainId = record.chainId.toString();
        }

        if (alive) {
          setState({
            connected: true,
            recordCount: recordCount.toString(),
            executionCount: executionCount.toString(),
            mode: modeLabels[Number(mode)] ?? "UNKNOWN",
            latestChainId
          });
        }
      } catch {
        if (alive) {
          setState((prev) => ({ ...prev, connected: false }));
        }
      }
    };

    const interval = setInterval(poll, 8000);
    poll();
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [client, strategyExecutor, whaleDataVault]);

  const metrics = [
    { label: "Whale Events", value: state.recordCount, note: state.connected ? "on-chain records" : "await deployment" },
    { label: "Tracked Chains", value: state.latestChainId ?? "-", note: "latest source chain" },
    { label: "Auto Actions", value: state.executionCount, note: "destination executions" },
    { label: "Risk Mode", value: state.mode, note: state.connected ? "live from executor" : "fallback mode" }
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <article key={metric.label} className="panel p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-ink/55">{metric.label}</p>
          <p className="mt-4 text-4xl font-semibold text-forest">{metric.value}</p>
          <p className="mt-2 text-sm text-ink/65">{metric.note}</p>
        </article>
      ))}
    </section>
  );
}
