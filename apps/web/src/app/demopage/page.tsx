import { deployedAddresses, strategyExecutorAbi, whaleDataVaultAbi } from "@hackathon/abi";
import { appConfig } from "@hackathon/config";
import { createPublicClient, formatEther, http } from "viem";
import DemoMissionControl from "../components/DemoMissionControl";

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
      }
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
    if (recordCount > 0n) {
      const record = await client.readContract({
        address: whaleDataVault as `0x${string}`,
        abi: whaleDataVaultAbi,
        functionName: "getRecord",
        args: [recordCount - 1n]
      });

      latestRecord = {
        whale: record.whale,
        chainId: record.chainId.toString(),
        amount: formatEther(record.amount),
        timestamp: formatTimestamp(record.timestamp),
        pnl: formatEther(record.pnl),
        strategyTag: record.strategyTag
      };
    }

    return {
      connected: true,
      recordCount: recordCount.toString(),
      executionCount: executionCount.toString(),
      mode: modeLabels[Number(mode)] ?? "UNKNOWN",
      latestRecord
    };
  } catch {
    return {
      connected: false,
      recordCount: "0",
      executionCount: "0",
      mode: "RPC ERROR",
      latestRecord: null
    };
  }
}

export default async function DemoPage() {
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? appConfig.defaultChainId);
  const originEmitter = process.env.NEXT_PUBLIC_ORIGIN_EMITTER ?? deployedAddresses.originEmitter;
  const blockExplorerUrl = process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL ?? "https://sepolia.basescan.org";

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-10 md:px-12 lg:px-16">
      <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-ember/15 blur-[120px]" />
      <div className="pointer-events-none absolute right-0 top-24 h-80 w-80 rounded-full bg-tide/60 blur-[140px]" />
      <div className="mx-auto max-w-7xl">
        <DemoMissionControl
          chainId={chainId}
          originEmitter={originEmitter}
          blockExplorerUrl={blockExplorerUrl}
        />
      </div>
    </main>
  );
}
