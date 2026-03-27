"use client";

import { whaleDataVaultAbi } from "@hackathon/abi";
import { useEffect, useMemo, useState } from "react";
import { createPublicClient, formatEther, http } from "viem";

const formatTimestamp = (value: bigint) => {
  const timestamp = Number(value) * 1000;
  if (!Number.isFinite(timestamp)) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(timestamp));
};

const truncateAddress = (value: string) => `${value.slice(0, 6)}...${value.slice(-4)}`;

type RecordItem = {
  id: string;
  whale: string;
  chainId: string;
  amount: string;
  amountValue: number;
  timestamp: string;
  pnl: string;
  strategyTag: string;
};

type LatestRecord = {
  whale: string;
  chainId: string;
  amount: string;
  timestamp: string;
  pnl: string;
  strategyTag: string;
} | null;

type LiveTelemetryProps = {
  rpcUrl: string;
  chainId: number;
  whaleDataVault: string;
  initialRecentRecords: RecordItem[];
  initialLatestRecord: LatestRecord;
};

export default function LiveTelemetry({
  rpcUrl,
  chainId,
  whaleDataVault,
  initialRecentRecords,
  initialLatestRecord
}: LiveTelemetryProps) {
  const [recentRecords, setRecentRecords] = useState<RecordItem[]>(initialRecentRecords);
  const [latestRecord, setLatestRecord] = useState<LatestRecord>(initialLatestRecord);

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
        const recordCount = await client.readContract({
          address: whaleDataVault as `0x${string}`,
          abi: whaleDataVaultAbi,
          functionName: "getRecordCount"
        });
        if (recordCount === 0n) {
          if (alive) {
            setRecentRecords([]);
            setLatestRecord(null);
          }
          return;
        }

        const total = Number(recordCount);
        const maxFetch = Math.min(total, 6);
        const fetched: RecordItem[] = [];

        for (let offset = 0; offset < maxFetch; offset += 1) {
          const index = BigInt(total - 1 - offset);
          const record = await client.readContract({
            address: whaleDataVault as `0x${string}`,
            abi: whaleDataVaultAbi,
            functionName: "getRecord",
            args: [index]
          });

          const amountEth = formatEther(record.amount);
          const amountValue = Number(amountEth);
          fetched.push({
            id: index.toString(),
            whale: record.whale,
            chainId: record.chainId.toString(),
            amount: amountEth,
            amountValue: Number.isFinite(amountValue) ? amountValue : 0,
            timestamp: formatTimestamp(record.timestamp),
            pnl: formatEther(record.pnl),
            strategyTag: record.strategyTag
          });
        }

        if (alive) {
          setRecentRecords(fetched);
          setLatestRecord(
            fetched[0]
              ? {
                  whale: fetched[0].whale,
                  chainId: fetched[0].chainId,
                  amount: fetched[0].amount,
                  timestamp: fetched[0].timestamp,
                  pnl: fetched[0].pnl,
                  strategyTag: fetched[0].strategyTag
                }
              : null
          );
        }
      } catch {
        if (alive) {
          setRecentRecords(initialRecentRecords);
          setLatestRecord(initialLatestRecord);
        }
      }
    };

    const interval = setInterval(poll, 8000);
    poll();
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [client, initialLatestRecord, initialRecentRecords, whaleDataVault]);

  const amounts = recentRecords.map((record) => record.amountValue);
  const maxAmount = Math.max(1, ...amounts);

  return (
    <article className="panel p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink/55">Signal Telemetry</p>
          <h2 className="mt-2 font-display text-2xl font-semibold">Recent whale flow</h2>
        </div>
        <span className="rounded-full bg-tide px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-forest">
          Live polling
        </span>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-black/5 bg-mist/70 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-ink/55">Volume heatmap</p>
          <div className="mt-4 flex items-end gap-2">
            {recentRecords.length === 0 ? (
              <div className="text-sm text-ink/60">No records yet. Emit a mock trade to start.</div>
            ) : (
              recentRecords.map((record) => {
                const height = Math.max(12, Math.round((record.amountValue / maxAmount) * 120));
                return (
                  <div key={record.id} className="flex flex-col items-center gap-2">
                    <div className="w-6 rounded-full bg-gradient-to-t from-forest to-ember/70" style={{ height }} />
                    <span className="text-[10px] uppercase tracking-[0.2em] text-ink/50">{record.id}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-black/5 bg-mist/70 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-ink/55">Latest record</p>
          {latestRecord ? (
            <div className="mt-4 space-y-3 text-sm text-ink/75">
              <p>Whale: {truncateAddress(latestRecord.whale)}</p>
              <p>Chain: {latestRecord.chainId}</p>
              <p>Amount: {latestRecord.amount} ETH</p>
              <p>Timestamp: {latestRecord.timestamp}</p>
              <p>PnL: {latestRecord.pnl} ETH</p>
              <p>Tag: {truncateAddress(latestRecord.strategyTag)}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink/65">No on-chain record available yet.</p>
          )}
        </div>
      </div>
    </article>
  );
}
