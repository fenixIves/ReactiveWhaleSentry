"use client";

import { strategyExecutorEventsAbi } from "@hackathon/abi";
import { useEffect, useMemo, useState } from "react";
import { createPublicClient, formatEther, http } from "viem";

const modeLabels = ["OBSERVE", "HEDGE", "GRID", "PAUSED"] as const;

const truncateAddress = (value: string) => `${value.slice(0, 6)}...${value.slice(-4)}`;

type ExecutionItem = {
  id: string;
  type: "StrategyExecuted" | "ProofSent" | "ProofFailed";
  mode: string;
  amount: string;
  target: string;
  txHash: string;
  blockNumber: bigint;
  logIndex: number;
};

type ExecutionLogProps = {
  rpcUrl: string;
  chainId: number;
  strategyExecutor: string;
  blockExplorerUrl?: string;
};

export default function ExecutionLog({ rpcUrl, chainId, strategyExecutor, blockExplorerUrl }: ExecutionLogProps) {
  const [items, setItems] = useState<ExecutionItem[]>([]);

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
        const latestBlock = await client.getBlockNumber();
        const fromBlock = latestBlock > 5000n ? latestBlock - 5000n : 0n;

        const [strategyLogs, proofSentLogs, proofFailedLogs] = await Promise.all([
          client.getLogs({
            address: strategyExecutor as `0x${string}`,
            event: strategyExecutorEventsAbi[0],
            fromBlock,
            toBlock: latestBlock
          }),
          client.getLogs({
            address: strategyExecutor as `0x${string}`,
            event: strategyExecutorEventsAbi[1],
            fromBlock,
            toBlock: latestBlock
          }),
          client.getLogs({
            address: strategyExecutor as `0x${string}`,
            event: strategyExecutorEventsAbi[2],
            fromBlock,
            toBlock: latestBlock
          })
        ]);

        const mapped: ExecutionItem[] = [];

        for (const log of strategyLogs) {
          const args = log.args as unknown as { whale: string; amount: bigint; mode: number };
          mapped.push({
            id: `${log.transactionHash}-${log.logIndex}`,
            type: "StrategyExecuted",
            mode: modeLabels[Number(args.mode)] ?? "UNKNOWN",
            amount: formatEther(args.amount),
            target: args.whale,
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
            logIndex: log.logIndex
          });
        }

        for (const log of proofSentLogs) {
          const args = log.args as unknown as { recipient: string; amount: bigint; mode: number };
          mapped.push({
            id: `${log.transactionHash}-${log.logIndex}`,
            type: "ProofSent",
            mode: modeLabels[Number(args.mode)] ?? "UNKNOWN",
            amount: formatEther(args.amount),
            target: args.recipient,
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
            logIndex: log.logIndex
          });
        }

        for (const log of proofFailedLogs) {
          const args = log.args as unknown as { recipient: string; amount: bigint; mode: number };
          mapped.push({
            id: `${log.transactionHash}-${log.logIndex}`,
            type: "ProofFailed",
            mode: modeLabels[Number(args.mode)] ?? "UNKNOWN",
            amount: formatEther(args.amount),
            target: args.recipient,
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
            logIndex: log.logIndex
          });
        }

        mapped.sort((a, b) => {
          if (a.blockNumber === b.blockNumber) return b.logIndex - a.logIndex;
          return a.blockNumber > b.blockNumber ? -1 : 1;
        });

        if (alive) {
          setItems(mapped.slice(0, 10));
        }
      } catch {
        if (alive) {
          setItems([]);
        }
      }
    };

    const interval = setInterval(poll, 9000);
    poll();

    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [client, strategyExecutor]);

  const explorerBase = blockExplorerUrl?.replace(/\/$/, "");

  return (
    <article className="panel p-8">
      <p className="text-xs uppercase tracking-[0.3em] text-ink/55">Execution Log</p>
      <h2 className="mt-3 font-display text-2xl font-semibold">Strategy + proof events</h2>
      <div className="mt-4 space-y-3 text-sm text-ink/75">
        {items.length === 0 ? (
          <p className="text-sm text-ink/65">No execution events yet. Emit a trade to trigger the flow.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-black/5 bg-white/80 p-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-ink/50">
                <span>{item.type}</span>
                <span>{item.mode}</span>
              </div>
              <div className="mt-2 grid gap-2 text-sm">
                <p>Amount: {item.amount} ETH</p>
                <p>Target: {truncateAddress(item.target)}</p>
                {explorerBase ? (
                  <a
                    className="text-xs text-ocean underline"
                    href={`${explorerBase}/tx/${item.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View tx
                  </a>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </article>
  );
}
