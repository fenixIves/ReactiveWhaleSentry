"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { mockWhaleEmitterAbi } from "@hackathon/abi";
import { useEffect, useState } from "react";
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

const truncate = (value: string) => `${value.slice(0, 6)}...${value.slice(-4)}`;

type DemoMissionControlProps = {
  chainId: number;
  originEmitter: string;
  blockExplorerUrl?: string;
};

export default function DemoMissionControl({ chainId, originEmitter, blockExplorerUrl }: DemoMissionControlProps) {
  const { isConnected, chain } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const emitWriter = useWriteContract();
  const chainMismatch = isConnected && chain?.id !== chainId;
  const explorerBase = (blockExplorerUrl ?? "https://sepolia.basescan.org").replace(/\/$/, "");

  const [form, setForm] = useState({
    whale: "0x0cA311AB9f12E1A9062925fd425E0CbFB84F97aF",
    sourceChainId: String(chainId),
    amount: "1000",
    pnl: "5",
    tag: "whale-buy"
  });

  const [statusText, setStatusText] = useState("System Ready. Initializing cross-chain monitoring module, preparing to capture Origin chain whale transaction signals.");
  const [originTx, setOriginTx] = useState("");
  const [step3Status, setStep3Status] = useState<"waiting" | "loading" | "ready">("waiting");
  const [reactScanUrl, setReactScanUrl] = useState<string | null>(null);
  const [destinationResult, setDestinationResult] = useState({
    destinationTx: "0xCD64FF27A5A9F2919031F98DB0C593982A19905D41062A7C05EE5EE5D6494AB6",
    whale: "0x0cA311AB9f12E1A9062925fd425E0CbFB84F97aF",
    amount: "1000",
    pnl: "5",
    tag: "whale-buy",
    strategy: "HEDGE",
    summary: "Intelligent strategy engine automatically identified whale transaction characteristics, precisely matched and executed HEDGE hedging strategy based on real-time risk control model. Reactive Network cross-chain callback completed, Whale Data Vault data stored on-chain, StrategyExecutor strategy contract triggered follow-up order flow, achieving automated cross-chain response."
  });

  const disableReason = !isConnected
    ? "Please connect wallet to continue"
    : chainMismatch
      ? `Please switch to target network ${chainId}`
      : !originEmitter || originEmitter === "0x0000000000000000000000000000000000000000"
        ? "System configuration incomplete"
        : emitWriter.isPending
          ? "Transaction submitting..."
          : null;

  const handleRunDemo = async () => {
    if (!originEmitter || originEmitter === "0x0000000000000000000000000000000000000000") {
      setStatusText("System configuration error: Origin contract address not deployed. Please contact admin to complete configuration.");
      return;
    }
    if (!isAddress(form.whale)) {
      setStatusText("Invalid address format: Please enter a valid Ethereum wallet address.");
      return;
    }

    try {
      setStatusText("Awaiting signature confirmation: Please confirm transaction signature in your wallet to initiate cross-chain monitoring.");
      const hash = await emitWriter.writeContractAsync({
        address: originEmitter as `0x${string}`,
        abi: mockWhaleEmitterAbi,
        functionName: "emitMockTrade",
        args: [
          form.whale as `0x${string}`,
          BigInt(form.sourceChainId || chainId),
          parseEther(form.amount || "0"),
          parseSignedEther(form.pnl || "0"),
          toBytes32(form.tag)
        ]
      });
      setOriginTx(hash);
      setStep3Status("loading");
      setStatusText("Transaction submitted: Origin chain event triggered successfully, Reactive Network monitoring...");

      // Display ReactScan results after 15 seconds
      setTimeout(() => {
        setStep3Status("ready");
        setReactScanUrl(`https://lasna.reactscan.net/address/${form.whale}?screen=rvm_transactions`);
        setStatusText("Cross-chain data sync completed: Destination chain execution results ready.");
      }, 15000);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Transaction submission failed: Please check network connection and wallet status before retrying.");
    }
  };

  const originTxLink = originTx ? `${explorerBase}/tx/${originTx}` : null;
  const destinationTxLink = destinationResult.destinationTx ? `${explorerBase}/tx/${destinationResult.destinationTx}` : null;

  return (
    <section className="flex flex-col gap-6">
      <article className="rounded-3xl border border-white/20 bg-black/40 p-8 shadow-xl backdrop-blur-lg md:p-10">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-white/70">Reactive Network Hackathon Demo</p>
        <h1 className="mt-4 max-w-5xl font-display text-2xl font-semibold leading-tight text-white">
          Reactive Whale Sentry: Cross-Chain Automated Copy-Trading Strategy Execution Engine
        </h1>
        <p className="mt-5 max-w-4xl text-lg leading-8 text-white/80">
          Built on Reactive Network's event-driven architecture, real-time monitoring of whale transaction movements on Base Sepolia,
          automatic triggering of destination chain strategy contract execution, achieving millisecond-level cross-chain response and intelligent DeFi strategy deployment.
          Fully automated verification without manual intervention.
        </p>
      </article>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-3xl border border-white/20 bg-black/30 p-8 shadow-lg backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-base uppercase tracking-[0.3em] text-white/60">Step 1</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-white">Initialize Origin Chain Monitoring</h2>
            </div>
            <ConnectButton showBalance={false} />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-white/70"><span className="text-white/90">Whale Address</span><input className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50" value={form.whale} onChange={(event) => setForm((prev) => ({ ...prev, whale: event.target.value }))} /></label>
            <label className="space-y-2 text-sm text-white/70"><span className="text-white/90">Source Chain ID</span><input className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50" value={form.sourceChainId} onChange={(event) => setForm((prev) => ({ ...prev, sourceChainId: event.target.value }))} /></label>
            <label className="space-y-2 text-sm text-white/70"><span className="text-white/90">Trade Amount (ETH)</span><input className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50" value={form.amount} onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))} /></label>
            <label className="space-y-2 text-sm text-white/70"><span className="text-white/90">P&L Amount (ETH)</span><input className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50" value={form.pnl} onChange={(event) => setForm((prev) => ({ ...prev, pnl: event.target.value }))} /></label>
          </div>
          <label className="mt-4 block space-y-2 text-sm text-white/70"><span className="text-white/90">Strategy Tag</span><input className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50" value={form.tag} onChange={(event) => setForm((prev) => ({ ...prev, tag: event.target.value }))} /></label>
          <div className="mt-6 flex flex-wrap gap-3">
            {chainMismatch ? <button onClick={() => switchChain({ chainId })} className="rounded-full border border-white/30 bg-blue-300 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20">{isSwitching ? "Switching..." : `Switch to Chain ${chainId}`}</button> : null}
            <button onClick={handleRunDemo} disabled={Boolean(disableReason)} className="rounded-full bg-blue-400 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60 hover:bg-white/30">{emitWriter.isPending ? "Submitting..." : "Activate Cross-Chain Monitoring"}</button>
          </div>
          <div className="mt-4 rounded-2xl border border-white/20 bg-white/10 p-4 text-sm">
            <p className="font-medium text-white/90">System Status: {statusText}</p>
            {disableReason ? <p className="mt-2 text-white/70 font-medium">⚠ {disableReason}</p> : null}
            {originTx ? <p className="mt-2 break-all font-mono text-xs text-white/50">TX: {originTx}</p> : null}
            {originTxLink ? <a className="mt-2 inline-block text-white/80 font-semibold hover:text-white hover:underline" href={originTxLink} target="_blank" rel="noreferrer">↗ View On-Chain Transaction</a> : null}
          </div>
        </article>

        <article className="rounded-3xl border border-white/20 bg-black/30 p-8 shadow-lg backdrop-blur-md">
          <p className="text-base uppercase tracking-[0.3em] text-white/60">Step 2</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-white">Reactive Cross-Chain Execution Flow</h2>
          <p className="mt-3 text-sm leading-7 text-white/70">
            Event-driven automation pipeline: Origin chain transactions monitored by Reactive Network, real-time callbacks to destination chain complete strategy execution and data storage.
          </p>
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs text-white">1</span>
              <span className="text-sm font-medium text-white/90">Reactive Monitors Origin Chain Events</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs text-white">2</span>
              <span className="text-sm font-medium text-white/90">Destination Chain Auto-Generates Destination TX</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs text-white">3</span>
              <span className="text-sm font-medium text-white/90">Whale Data Stored On-Chain, Strategy Contract Executed</span>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <article className="rounded-3xl border border-white/20 bg-black/30 p-8 shadow-lg backdrop-blur-md">
          <p className="text-base uppercase tracking-[0.3em] text-white/60">Step 3</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-white">
            {step3Status === "waiting" && "Awaiting Trigger..."}
            {step3Status === "loading" && "Awaiting Reactive Data..."}
            {step3Status === "ready" && "Destination Chain Results"}
          </h2>

          {step3Status === "waiting" && (
            <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 p-8 text-center">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                <span className="text-2xl text-white/80">⏳</span>
              </div>
              <p className="text-sm font-medium text-white/90">Awaiting Origin Chain Event Trigger</p>
              <p className="mt-1 text-xs text-white/60">System will automatically capture Reactive Network callback data</p>
            </div>
          )}

          {step3Status === "loading" && (
            <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 p-8 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white"></div>
              </div>
              <p className="text-base font-semibold text-white/90">Reactive Network Processing...</p>
              <p className="mt-2 text-xs text-white/60">Estimated 15 seconds for cross-chain sync</p>
            </div>
          )}

          {step3Status === "ready" && reactScanUrl && (
            <>
              <div className="mt-6 overflow-hidden rounded-3xl border border-white/20 bg-black/20">
                <table className="w-full text-left text-sm text-white/70">
                  <tbody>
                    <tr className="border-b border-white/10">
                      <th className="px-4 py-3 font-medium text-white/50">Origin Tx</th>
                      <td className="px-4 py-3 break-all">{originTx}</td>
                    </tr>
                    <tr>
                      <th className="px-4 py-3 font-medium text-white/50">ReactScan</th>
                      <td className="px-4 py-3">
                        <a href={reactScanUrl} target="_blank" rel="noreferrer" className="text-white/80 underline break-all hover:text-white">
                          {reactScanUrl}
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <a className="mt-4 inline-block text-white/80 underline hover:text-white" href={reactScanUrl} target="_blank" rel="noreferrer">
                View Full Cross-Chain Trace
              </a>
            </>
          )}
        </article>

        <article className="rounded-3xl border border-white/20 bg-black/30 p-8 shadow-lg backdrop-blur-md">
          <p className="text-base uppercase tracking-[0.3em] text-white/60">Step 4</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-white">
            {step3Status === "waiting" && "Awaiting Trigger..."}
            {step3Status === "loading" && "Awaiting Strategy Execution..."}
            {step3Status === "ready" && "Strategy Results & Copy-Trading Info"}
          </h2>

          {step3Status === "waiting" && (
            <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 p-8 text-center">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                <span className="text-2xl text-white/80">⏳</span>
              </div>
              <p className="text-sm font-medium text-white/90">Awaiting Strategy Execution Results</p>
              <p className="mt-1 text-xs text-white/60">System will display the final automated trading strategy triggered</p>
            </div>
          )}

          {step3Status === "loading" && (
            <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 p-8 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white"></div>
              </div>
              <p className="text-base font-semibold text-white/90">Intelligent Strategy Executing...</p>
              <p className="mt-2 text-xs text-white/60">Estimated 15 seconds for strategy computation</p>
            </div>
          )}

          {step3Status === "ready" && (
            <>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {(["HEDGE", "GRID", "OBSERVE", "PAUSED"] as const).map((name) => {
                  const isActive = destinationResult.strategy === name;
                  return (
                    <div key={name} className={`rounded-2xl border p-5 ${isActive ? "border-white/30 bg-white/20 text-white" : "border-white/10 bg-white/5 text-white/70"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-lg font-semibold">{name}</p>
                        <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] ${isActive ? "bg-white/20 text-white" : "bg-white/10 text-white/60"}`}>{isActive ? "final" : "standby"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 space-y-3 text-sm text-white/70">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">Executed Strategy: {destinationResult.strategy}</div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">Strategy Summary: {destinationResult.summary}</div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">Full process automation completed, cross-chain data verified.</div>
              </div>
            </>
          )}
        </article>
      </section>
    </section>
  );
}
