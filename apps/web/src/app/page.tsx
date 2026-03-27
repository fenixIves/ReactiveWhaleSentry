import { deployedAddresses, strategyExecutorAbi, whaleDataVaultAbi } from "@hackathon/abi";
import { appConfig } from "@hackathon/config";
import { createPublicClient, formatEther, http } from "viem";
import OperatorConsole from "./components/OperatorConsole";
import ExecutionLog from "./components/ExecutionLog";
import LiveMetrics from "./components/LiveMetrics";
import LiveTelemetry from "./components/LiveTelemetry";

const zeroAddress = "0x0000000000000000000000000000000000000000";
const modeLabels = ["OBSERVE", "HEDGE", "GRID", "PAUSED"] as const;

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

async function loadDashboard() {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL ?? appConfig.rpcUrl;
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? appConfig.defaultChainId);
  const whaleDataVault = process.env.NEXT_PUBLIC_WHALE_DATA_VAULT ?? deployedAddresses.whaleDataVault;
  const strategyExecutor = process.env.NEXT_PUBLIC_STRATEGY_EXECUTOR ?? deployedAddresses.strategyExecutor;

  if (whaleDataVault === zeroAddress || strategyExecutor === zeroAddress) {
    return {
      connected: false,
      recordCount: "0",
      executionCount: "0",
      mode: "UNDEPLOYED",
      latestRecord: null as null | {
        whale: string;
        chainId: string;
        amount: string;
        timestamp: string;
        pnl: string;
        strategyTag: string;
      },
      recentRecords: [] as Array<{
        id: string;
        whale: string;
        chainId: string;
        amount: string;
        amountValue: number;
        timestamp: string;
        pnl: string;
        strategyTag: string;
      }>
    };
  }

  try {
    const client = createPublicClient({
      chain: {
        id: chainId,
        name: "hackathon-local",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrls: { default: { http: [rpcUrl] } }
      },
      transport: http(rpcUrl)
    });

    const [recordCount, executionCount, mode] = await Promise.all([
      client.readContract({ address: whaleDataVault as `0x${string}`, abi: whaleDataVaultAbi, functionName: "getRecordCount" }),
      client.readContract({ address: strategyExecutor as `0x${string}`, abi: strategyExecutorAbi, functionName: "getExecutionCount" }),
      client.readContract({ address: strategyExecutor as `0x${string}`, abi: strategyExecutorAbi, functionName: "currentMode" })
    ]);

    let latestRecord = null;
    const recentRecords: Array<{
      id: string;
      whale: string;
      chainId: string;
      amount: string;
      amountValue: number;
      timestamp: string;
      pnl: string;
      strategyTag: string;
    }> = [];

    if (recordCount > 0n) {
      const total = Number(recordCount);
      const maxFetch = Math.min(total, 6);
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
        const formatted = {
          id: index.toString(),
          whale: record.whale,
          chainId: record.chainId.toString(),
          amount: amountEth,
          amountValue: Number.isFinite(amountValue) ? amountValue : 0,
          timestamp: formatTimestamp(record.timestamp),
          pnl: formatEther(record.pnl),
          strategyTag: record.strategyTag
        };

        recentRecords.push(formatted);
        if (offset === 0) {
          latestRecord = {
            whale: formatted.whale,
            chainId: formatted.chainId,
            amount: formatted.amount,
            timestamp: formatted.timestamp,
            pnl: formatted.pnl,
            strategyTag: formatted.strategyTag
          };
        }
      }
    }

    return {
      connected: true,
      recordCount: recordCount.toString(),
      executionCount: executionCount.toString(),
      mode: modeLabels[Number(mode)] ?? "UNKNOWN",
      latestRecord,
      recentRecords
    };
  } catch {
    return {
      connected: false,
      recordCount: "0",
      executionCount: "0",
      mode: "RPC ERROR",
      latestRecord: null,
      recentRecords: []
    };
  }
}

export default async function HomePage() {
  const data = await loadDashboard();
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL ?? appConfig.rpcUrl;
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? appConfig.defaultChainId);
  const whaleDataVault = process.env.NEXT_PUBLIC_WHALE_DATA_VAULT ?? deployedAddresses.whaleDataVault;
  const originEmitter = process.env.NEXT_PUBLIC_ORIGIN_EMITTER ?? deployedAddresses.originEmitter;
  const strategyExecutor = process.env.NEXT_PUBLIC_STRATEGY_EXECUTOR ?? deployedAddresses.strategyExecutor;
  const blockExplorerUrl = process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL;
  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-10 md:px-12 lg:px-16">
      <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-ember/15 blur-[120px]" />
      <div className="pointer-events-none absolute right-0 top-24 h-80 w-80 rounded-full bg-tide/60 blur-[140px]" />

      <section className="mx-auto flex max-w-7xl flex-col gap-10">
        <div className="panel-strong relative overflow-hidden p-8 md:p-12">
          <div className="absolute -right-24 top-0 h-64 w-64 rounded-full border border-forest/20 bg-white/40" />
          <p className="text-xs uppercase tracking-[0.4em] text-forest/70">Reactive DApp Hackathon</p>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h1 className="max-w-4xl font-display text-4xl font-semibold leading-tight md:text-6xl">
                Smart Whale Sentinel
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-ink/70">
                A reactive, cross-chain watchdog that converts whale trading signals into automatic risk shifts — all on
                chain, no centralized bots.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="rounded-full border border-forest/30 bg-white px-4 py-2 text-xs uppercase tracking-[0.3em] text-forest">
                  Origin → Reactive → Destination
                </span>
                <span className="rounded-full border border-forest/10 bg-tide/60 px-4 py-2 text-xs uppercase tracking-[0.3em] text-forest">
                  Base Sepolia + Lasna
                </span>
              </div>
            </div>
            <div className="rounded-3xl bg-forest p-6 text-mist shadow-glow">
              <p className="text-xs uppercase tracking-[0.35em] text-mist/60">Live Loop</p>
              <p className="mt-4 text-2xl font-medium leading-snug">
                Origin event → Reactive subscription → Destination callback → Strategy shift
              </p>
              <p className="mt-3 text-sm leading-6 text-mist/75">
                {data.connected
                  ? "Dashboard is reading deployed chain state through shared ABI exports."
                  : "Connect deployed addresses in env to switch from placeholder mode to live on-chain reads."}
              </p>
            </div>
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="panel p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/55">Project Map</p>
            <h2 className="mt-3 font-display text-2xl font-semibold">What the contracts do</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-black/5 bg-mist/70 p-5">
                <p className="text-sm font-semibold text-forest">Origin: MockWhaleEmitter</p>
                <ul className="mt-3 space-y-2 text-sm text-ink/70">
                  <li>Emits WhaleTradeDetected events.</li>
                  <li>Encodes amount, pnl, and strategy tag.</li>
                  <li>Acts as the demo whale signal source.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-black/5 bg-mist/70 p-5">
                <p className="text-sm font-semibold text-forest">Reactive: WhaleReactiveContract</p>
                <ul className="mt-3 space-y-2 text-sm text-ink/70">
                  <li>Subscribes to origin event topic.</li>
                  <li>Validates chain + emitter.</li>
                  <li>Emits callback payload to destination.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-black/5 bg-mist/70 p-5">
                <p className="text-sm font-semibold text-forest">Destination: Vault + Executor</p>
                <ul className="mt-3 space-y-2 text-sm text-ink/70">
                  <li>Stores whale record on-chain.</li>
                  <li>Updates strategy mode automatically.</li>
                  <li>Exposes state for the frontend.</li>
                </ul>
              </div>
            </div>
          </article>

          <article className="panel p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/55">Strategy Logic</p>
            <h2 className="mt-3 font-display text-2xl font-semibold">How mode shifts happen</h2>
            <div className="mt-6 space-y-4 text-sm text-ink/75">
              <div className="rounded-2xl border border-black/5 bg-white/80 p-4">
                <p className="font-semibold text-forest">HEDGE</p>
                <p>Triggered when amount ≥ 1,000,000 ETH.</p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white/80 p-4">
                <p className="font-semibold text-forest">GRID</p>
                <p>Triggered when PnL is negative.</p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white/80 p-4">
                <p className="font-semibold text-forest">OBSERVE</p>
                <p>Default mode for regular whale flows.</p>
              </div>
            </div>
          </article>
        </section>

        <LiveMetrics
          rpcUrl={rpcUrl}
          chainId={chainId}
          whaleDataVault={whaleDataVault}
          strategyExecutor={strategyExecutor}
          initial={{
            recordCount: data.recordCount,
            executionCount: data.executionCount,
            mode: data.mode,
            latestChainId: data.latestRecord?.chainId ?? null,
            connected: data.connected
          }}
        />

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <LiveTelemetry
            rpcUrl={rpcUrl}
            chainId={chainId}
            whaleDataVault={whaleDataVault}
            initialRecentRecords={data.recentRecords}
            initialLatestRecord={data.latestRecord}
          />

          <ExecutionLog
            rpcUrl={rpcUrl}
            chainId={chainId}
            strategyExecutor={strategyExecutor}
            blockExplorerUrl={blockExplorerUrl}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <OperatorConsole
            originEmitter={originEmitter}
            strategyExecutor={strategyExecutor}
            chainId={chainId}
            blockExplorerUrl={blockExplorerUrl}
            defaultWhale={data.latestRecord?.whale}
            defaultAmount={data.latestRecord?.amount}
            defaultPnl={data.latestRecord?.pnl}
          />

          <article className="panel p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/55">Deployment Links</p>
            <h2 className="mt-3 font-display text-2xl font-semibold">Connected contracts</h2>
            <div className="mt-6 space-y-3 text-sm text-ink/75">
              <div className="rounded-2xl border border-black/5 bg-white/80 p-4">Vault: {process.env.NEXT_PUBLIC_WHALE_DATA_VAULT ?? deployedAddresses.whaleDataVault}</div>
              <div className="rounded-2xl border border-black/5 bg-white/80 p-4">Executor: {process.env.NEXT_PUBLIC_STRATEGY_EXECUTOR ?? deployedAddresses.strategyExecutor}</div>
              <div className="rounded-2xl border border-black/5 bg-white/80 p-4">Reactive: {process.env.NEXT_PUBLIC_WHALE_REACTIVE_CONTRACT ?? deployedAddresses.whaleReactiveContract}</div>
              <div className="rounded-2xl border border-black/5 bg-white/80 p-4">Origin Emitter: {process.env.NEXT_PUBLIC_ORIGIN_EMITTER ?? deployedAddresses.originEmitter}</div>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
