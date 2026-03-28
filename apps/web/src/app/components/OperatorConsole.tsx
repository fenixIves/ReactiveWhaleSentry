"use client";

import { mockWhaleEmitterAbi, strategyExecutorAbi } from "@hackathon/abi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState } from "react";
import { isAddress, isHex, pad, parseEther, stringToHex } from "viem";
import { useAccount, useSwitchChain, useWriteContract } from "wagmi";

const toBytes32 = (value: string): `0x${string}` => {
  const trimmed = value.trim();
  if (trimmed.length === 0) return "0x".padEnd(66, "0") as `0x${string}`;
  if (isHex(trimmed) && trimmed.length === 66) return trimmed as `0x${string}`;
  return pad(stringToHex(trimmed), { size: 32 }) as `0x${string}`;
};

const parseSignedEther = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.length === 0) return 0n;
  const isNegative = trimmed.startsWith("-");
  const raw = isNegative ? trimmed.slice(1) : trimmed;
  const parsed = parseEther(raw || "0");
  return isNegative ? -parsed : parsed;
};

type OperatorConsoleProps = {
  originEmitter: string;
  strategyExecutor: string;
  chainId: number;
  blockExplorerUrl?: string;
  defaultWhale?: string;
  defaultAmount?: string;
  defaultPnl?: string;
};

export default function OperatorConsole({
  originEmitter,
  strategyExecutor,
  chainId,
  blockExplorerUrl,
  defaultWhale = "",
  defaultAmount = "25000",
  defaultPnl = "120"
}: OperatorConsoleProps) {
  const { isConnected, chain } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const emitWriter = useWriteContract();
  const executeWriter = useWriteContract();

  const [emitForm, setEmitForm] = useState({
    whale: defaultWhale,
    sourceChainId: String(chainId),
    amount: defaultAmount,
    pnl: defaultPnl,
    tag: "alpha"
  });
  const [emitStatus, setEmitStatus] = useState<string | null>(null);
  const [emitHash, setEmitHash] = useState<string | null>(null);

  const [execForm, setExecForm] = useState({
    whale: defaultWhale,
    amount: defaultAmount,
    pnl: defaultPnl,
    reason: "manual"
  });
  const [execStatus, setExecStatus] = useState<string | null>(null);
  const [execHash, setExecHash] = useState<string | null>(null);

  const chainMismatch = isConnected && chain?.id !== chainId;
  const explorerBase = blockExplorerUrl?.replace(/\/$/, "");
  const txLink = (hash: string | null) => (explorerBase && hash ? `${explorerBase}/tx/${hash}` : null);

  const handleEmit = async () => {
    setEmitStatus(null);
    setEmitHash(null);
    if (!originEmitter || originEmitter === "0x0000000000000000000000000000000000000000") {
      setEmitStatus("Origin emitter not configured.");
      return;
    }
    if (!isAddress(emitForm.whale)) {
      setEmitStatus("Invalid whale address.");
      return;
    }
    try {
      const hash = await emitWriter.writeContractAsync({
        address: originEmitter as `0x${string}`,
        abi: mockWhaleEmitterAbi,
        functionName: "emitMockTrade",
        args: [
          emitForm.whale as `0x${string}`,
          BigInt(emitForm.sourceChainId || chainId),
          parseEther(emitForm.amount || "0"),
          parseSignedEther(emitForm.pnl || "0"),
          toBytes32(emitForm.tag)
        ]
      });
      setEmitStatus(`Submitted: ${hash}`);
      setEmitHash(hash);
    } catch (error) {
      setEmitStatus(error instanceof Error ? error.message : "Transaction failed.");
    }
  };

  const handleExecute = async () => {
    setExecStatus(null);
    setExecHash(null);
    if (!strategyExecutor || strategyExecutor === "0x0000000000000000000000000000000000000000") {
      setExecStatus("Strategy executor not configured.");
      return;
    }
    if (!isAddress(execForm.whale)) {
      setExecStatus("Invalid whale address.");
      return;
    }
    try {
      const hash = await executeWriter.writeContractAsync({
        address: strategyExecutor as `0x${string}`,
        abi: strategyExecutorAbi,
        functionName: "execute",
        args: [
          execForm.whale as `0x${string}`,
          parseEther(execForm.amount || "0"),
          parseSignedEther(execForm.pnl || "0"),
          toBytes32(execForm.reason)
        ]
      });
      setExecStatus(`Submitted: ${hash}`);
      setExecHash(hash);
    } catch (error) {
      setExecStatus(error instanceof Error ? error.message : "Transaction failed.");
    }
  };

  return (
    <article className="panel p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink/55">Operator Console</p>
          <h2 className="mt-3 font-display text-2xl font-semibold">User controls & simulations</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <ConnectButton showBalance={false} />
          {chainMismatch ? (
            <button
              onClick={() => switchChain({ chainId })}
              className="rounded-full border border-ember/40 bg-ember/10 px-3 py-1 uppercase tracking-[0.2em] text-ember"
              disabled={isSwitching}
            >
              Switch network
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-mist/70 p-4">
          <p className="text-sm font-semibold text-forest">Emit mock whale trade</p>
          <div className="mt-3 space-y-3 text-sm">
            <input
              className="w-full rounded-xl border border-black/10 bg-white/90 px-3 py-2"
              placeholder="Whale address"
              value={emitForm.whale}
              onChange={(event) => setEmitForm((prev) => ({ ...prev, whale: event.target.value }))}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className="w-full rounded-xl border border-black/10 bg-white/90 px-3 py-2"
                placeholder="Source chain id"
                value={emitForm.sourceChainId}
                onChange={(event) => setEmitForm((prev) => ({ ...prev, sourceChainId: event.target.value }))}
              />
              <input
                className="w-full rounded-xl border border-black/10 bg-white/90 px-3 py-2"
                placeholder="Tag"
                value={emitForm.tag}
                onChange={(event) => setEmitForm((prev) => ({ ...prev, tag: event.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                className="w-full rounded-xl border border-black/10 bg-white/90 px-3 py-2"
                placeholder="Amount (ETH)"
                value={emitForm.amount}
                onChange={(event) => setEmitForm((prev) => ({ ...prev, amount: event.target.value }))}
              />
              <input
                className="w-full rounded-xl border border-black/10 bg-white/90 px-3 py-2"
                placeholder="PnL (ETH)"
                value={emitForm.pnl}
                onChange={(event) => setEmitForm((prev) => ({ ...prev, pnl: event.target.value }))}
              />
            </div>
            <button
              onClick={handleEmit}
              disabled={!isConnected || chainMismatch || emitWriter.isPending}
              className="w-full rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {emitWriter.isPending ? "Sending..." : "Send to origin emitter"}
            </button>
            {emitStatus ? <p className="text-xs text-ink/60">{emitStatus}</p> : null}
            {txLink(emitHash) ? (
              <a className="text-xs text-ocean underline" href={txLink(emitHash) ?? "#"} target="_blank" rel="noreferrer">
                View on explorer
              </a>
            ) : null}
          </div>
        </div>
        <div className="rounded-2xl border border-black/5 bg-mist/70 p-4">
          <p className="text-sm font-semibold text-forest">Manual strategy execute</p>
          <div className="mt-3 space-y-3 text-sm">
            <input
              className="w-full rounded-xl border border-black/10 bg-white/90 px-3 py-2"
              placeholder="Whale address"
              value={execForm.whale}
              onChange={(event) => setExecForm((prev) => ({ ...prev, whale: event.target.value }))}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className="w-full rounded-xl border border-black/10 bg-white/90 px-3 py-2"
                placeholder="Amount (ETH)"
                value={execForm.amount}
                onChange={(event) => setExecForm((prev) => ({ ...prev, amount: event.target.value }))}
              />
              <input
                className="w-full rounded-xl border border-black/10 bg-white/90 px-3 py-2"
                placeholder="PnL (ETH)"
                value={execForm.pnl}
                onChange={(event) => setExecForm((prev) => ({ ...prev, pnl: event.target.value }))}
              />
            </div>
            <input
              className="w-full rounded-xl border border-black/10 bg-white/90 px-3 py-2"
              placeholder="Reason tag"
              value={execForm.reason}
              onChange={(event) => setExecForm((prev) => ({ ...prev, reason: event.target.value }))}
            />
            <button
              onClick={handleExecute}
              disabled={!isConnected || chainMismatch || executeWriter.isPending}
              className="w-full rounded-xl border border-forest/30 bg-white px-4 py-2 text-sm font-semibold text-forest disabled:opacity-60"
            >
              {executeWriter.isPending ? "Executing..." : "Execute strategy"}
            </button>
            {execStatus ? <p className="text-xs text-ink/60">{execStatus}</p> : null}
            {txLink(execHash) ? (
              <a className="text-xs text-ocean underline" href={txLink(execHash) ?? "#"} target="_blank" rel="noreferrer">
                View on explorer
              </a>
            ) : null}
            <p className="text-xs text-ink/60">Requires operator permissions on StrategyExecutor.</p>
          </div>
        </div>
      </div>
    </article>
  );
}
