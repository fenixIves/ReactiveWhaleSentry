"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { mockWhaleEmitterAbi, strategyExecutorAbi, strategyExecutorEventsAbi, whaleDataVaultAbi } from "@hackathon/abi";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPublicClient, formatEther, http, isAddress, isHex, pad, parseEther, stringToHex } from "viem";
import { useAccount, useSwitchChain, useWriteContract } from "wagmi";

const modeLabels = ["OBSERVE", "HEDGE", "GRID", "PAUSED"] as const;

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

const formatTimestamp = (value: bigint) => {
  const timestamp = Number(value) * 1000;
  if (!Number.isFinite(timestamp)) return "-";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(timestamp));
};

const truncate = (value: string) => `${value.slice(0, 6)}...${value.slice(-4)}`;

const decodeTag = (value: string) => {
  try {
    const bytes = value.slice(2).match(/.{1,2}/g) ?? [];
    const decoded = bytes
      .map((part) => Number.parseInt(part, 16))
      .filter((part) => Number.isFinite(part) && part !== 0)
      .map((part) => String.fromCharCode(part))
      .join("");
    return decoded || value;
  } catch {
    return value;
  }
};

type RecordSnapshot = {
  whale: string;
  chainId: string;
  amount: string;
  timestamp: string;
  pnl: string;
  strategyTag: string;
};

type ExecutionSnapshot = {
  whale: string;
  amount: string;
  timestamp: string;
  mode: string;
  reason: string;
};

type DestinationActivity = {
  txHash: string;
  mode: string;
  type: "StrategyExecuted" | "ProofSent" | "ProofFailed";
  amount: string;
  target: string;
};

type DemoMissionControlProps = {
  rpcUrl: string;
  chainId: number;
  originEmitter: string;
  whaleDataVault: string;
  strategyExecutor: string;
  blockExplorerUrl?: string;
  initial: {
    connected: boolean;
    recordCount: string;
    executionCount: string;
    mode: string;
    latestRecord: RecordSnapshot | null;
  };
};

type DemoPhase = "idle" | "wallet" | "origin" | "reactive" | "destination" | "done" | "error";

type StreamItem = {
  id: string;
  stage: string;
  title: string;
  detail: string;
  tone?: "neutral" | "good" | "warn";
};

type PendingDemo = {
  whale: string;
  sourceChainId: string;
  amountWei: bigint;
  pnlWei: bigint;
  tagHex: `0x${string}`;
  tagText: string;
  originTxHash: string;
};

export default function DemoMissionControl({
  rpcUrl,
  chainId,
  originEmitter,
  whaleDataVault,
  strategyExecutor,
  blockExplorerUrl
}: DemoMissionControlProps) {
  const { isConnected, chain } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const emitWriter = useWriteContract();
  const chainMismatch = isConnected && chain?.id !== chainId;
  const explorerBase = (blockExplorerUrl ?? "https://sepolia.basescan.org").replace(/\/$/, "");

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

  const [form, setForm] = useState({
    whale: "0x0cA311AB9f12E1A9062925fd425E0CbFB84F97aF",
    sourceChainId: String(chainId),
    amount: "1000",
    pnl: "5",
    tag: "whale-buy"
  });
  const [demoPhase, setDemoPhase] = useState<DemoPhase>("idle");
  const [statusText, setStatusText] = useState("点击开始监听并模拟巨鲸后，前端会先发出 Origin tx，再按这次 tx 去目标链查对应结果。");
  const [emitHash, setEmitHash] = useState<string | null>(null);
  const [matchedRecord, setMatchedRecord] = useState<RecordSnapshot | null>(null);
  const [matchedExecution, setMatchedExecution] = useState<ExecutionSnapshot | null>(null);
  const [matchedDestinationActivity, setMatchedDestinationActivity] = useState<DestinationActivity | null>(null);
  const [mode, setMode] = useState("UNKNOWN");
  const [connected, setConnected] = useState(true);
  const [stream, setStream] = useState<StreamItem[]>([]);
  const [actionHint, setActionHint] = useState("等待本次 Origin tx 触发后去目标链匹配对应记录");
  const [finalTxHint, setFinalTxHint] = useState("等待匹配本次目标链执行 tx");
  const [pendingDemo, setPendingDemo] = useState<PendingDemo | null>(null);
  const scanStartRef = useRef<null | { recordCount: bigint; executionCount: bigint }>(null);

  const appendStream = (item: StreamItem) => {
    setStream((prev) => [item, ...prev].slice(0, 8));
  };

  const disableReason = !isConnected
    ? "请先连接钱包"
    : chainMismatch
      ? `请先切换到链 ${chainId}`
      : !originEmitter || originEmitter === "0x0000000000000000000000000000000000000000"
        ? "Origin 合约地址未配置"
        : emitWriter.isPending
          ? "交易发送中"
          : null;

  useEffect(() => {
    let alive = true;

    const poll = async () => {
      if (!pendingDemo) return;

      try {
        const [recordCount, executionCount, currentMode, latestBlock] = await Promise.all([
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
          }),
          client.getBlockNumber()
        ]);

        if (!alive) return;

        setConnected(true);
        setMode(modeLabels[Number(currentMode)] ?? "UNKNOWN");

        if (demoPhase === "origin") {
          setDemoPhase("reactive");
          setStatusText("Origin tx 已成功发出，正在根据这次参数匹配目标链记录。");
          appendStream({
            id: `reactive-${Date.now()}`,
            stage: "Reactive",
            title: "开始等待这次目标链回调",
            detail: `正在查找 whale=${truncate(pendingDemo.whale)} amount=${formatEther(pendingDemo.amountWei)} tag=${pendingDemo.tagText} 对应的目标链记录。`,
            tone: "neutral"
          });
        }

        const start = scanStartRef.current;
        const totalRecords = Number(recordCount);
        const fromRecord = start ? Number(start.recordCount) : Math.max(0, totalRecords - 12);
        const toRecord = Number(recordCount);

        let foundRecord: RecordSnapshot | null = null;
        if (!matchedRecord && toRecord > fromRecord) {
          for (let index = toRecord - 1; index >= fromRecord; index -= 1) {
            const record = await client.readContract({
              address: whaleDataVault as `0x${string}`,
              abi: whaleDataVaultAbi,
              functionName: "getRecord",
              args: [BigInt(index)]
            });

            const same =
              record.whale.toLowerCase() === pendingDemo.whale.toLowerCase() &&
              record.chainId === BigInt(pendingDemo.sourceChainId) &&
              record.amount === pendingDemo.amountWei &&
              record.pnl === pendingDemo.pnlWei &&
              record.strategyTag.toLowerCase() === pendingDemo.tagHex.toLowerCase();

            if (same) {
              foundRecord = {
                whale: record.whale,
                chainId: record.chainId.toString(),
                amount: formatEther(record.amount),
                timestamp: formatTimestamp(record.timestamp),
                pnl: formatEther(record.pnl),
                strategyTag: record.strategyTag
              };
              break;
            }
          }
        }

        if (foundRecord) {
          setMatchedRecord(foundRecord);
          setDemoPhase("destination");
          setStatusText("已经在目标链找到了这次 Origin tx 对应的记录。");
          setActionHint("正在继续匹配这次记录对应的策略执行结果");
          appendStream({
            id: `record-${Date.now()}`,
            stage: "Target",
            title: "找到本次目标链记录",
            detail: `Whale=${truncate(foundRecord.whale)} Amount=${foundRecord.amount} ETH PnL=${foundRecord.pnl} ETH`,
            tone: "good"
          });
        }

        const fromBlock = latestBlock > 3000n ? latestBlock - 3000n : 0n;
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

        if (matchedRecord && !matchedExecution) {
          const totalExecutions = Number(executionCount);
          const executionStart = start ? Number(start.executionCount) : Math.max(0, totalExecutions - 12);
          for (let index = totalExecutions - 1; index >= executionStart; index -= 1) {
            const execution = await client.readContract({
              address: strategyExecutor as `0x${string}`,
              abi: strategyExecutorAbi,
              functionName: "getExecution",
              args: [BigInt(index)]
            });

            const same =
              execution.whale.toLowerCase() === pendingDemo.whale.toLowerCase() &&
              execution.amount === pendingDemo.amountWei &&
              execution.reason.toLowerCase() === pendingDemo.tagHex.toLowerCase();

            if (same) {
              const executionMode = modeLabels[Number(execution.mode)] ?? "UNKNOWN";
              const nextExecution = {
                whale: execution.whale,
                amount: formatEther(execution.amount),
                timestamp: formatTimestamp(execution.timestamp),
                mode: executionMode,
                reason: decodeTag(execution.reason)
              };
              setMatchedExecution(nextExecution);
              setDemoPhase("done");
              setStatusText(`这次目标链执行已完成，策略模式为 ${executionMode}。`);
              setActionHint(`本次记录匹配到的执行模式：${executionMode}`);
              appendStream({
                id: `execution-${Date.now()}`,
                stage: "Executor",
                title: "找到本次策略执行",
                detail: `Mode=${executionMode} Amount=${formatEther(execution.amount)} ETH Reason=${decodeTag(execution.reason)}`,
                tone: "good"
              });
              break;
            }
          }
        }

        if (!matchedDestinationActivity) {
          const combined = [
            ...strategyLogs.map((log) => ({
              txHash: log.transactionHash,
              type: "StrategyExecuted" as const,
              mode: modeLabels[Number((log.args as { mode: number }).mode)] ?? "UNKNOWN",
              amount: formatEther((log.args as { amount: bigint }).amount),
              target: (log.args as { whale: string }).whale
            })),
            ...proofSentLogs.map((log) => ({
              txHash: log.transactionHash,
              type: "ProofSent" as const,
              mode: modeLabels[Number((log.args as { mode: number }).mode)] ?? "UNKNOWN",
              amount: formatEther((log.args as { amount: bigint }).amount),
              target: (log.args as { recipient: string }).recipient
            })),
            ...proofFailedLogs.map((log) => ({
              txHash: log.transactionHash,
              type: "ProofFailed" as const,
              mode: modeLabels[Number((log.args as { mode: number }).mode)] ?? "UNKNOWN",
              amount: formatEther((log.args as { amount: bigint }).amount),
              target: (log.args as { recipient: string }).recipient
            }))
          ];

          const matchedLog = combined.find((item) => {
            if (item.type === "StrategyExecuted") {
              return (
                item.target.toLowerCase() === pendingDemo.whale.toLowerCase() &&
                item.amount === formatEther(pendingDemo.amountWei)
              );
            }
            return item.mode === (matchedExecution?.mode ?? modeLabels[1]);
          });

          if (matchedLog) {
            setMatchedDestinationActivity(matchedLog);
            setFinalTxHint(`已经匹配到这次目标链 tx：${matchedLog.type}`);
          }
        }
      } catch {
        if (!alive) return;
        setConnected(false);
        if (["origin", "reactive", "destination"].includes(demoPhase)) {
          setStatusText("Origin tx 已经发出，但当前前端暂时无法精确读取目标链结果。请检查 RPC 和目标链地址。");
        }
      }
    };

    const interval = setInterval(poll, 3000);
    poll();
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [client, demoPhase, matchedDestinationActivity, matchedExecution, matchedRecord, pendingDemo, strategyExecutor, whaleDataVault]);

  const handleRunDemo = async () => {
    setEmitHash(null);
    setMatchedRecord(null);
    setMatchedExecution(null);
    setMatchedDestinationActivity(null);
    setPendingDemo(null);
    setStream([]);
    setMode("UNKNOWN");
    setActionHint("等待本次 Origin tx 触发后去目标链匹配对应记录");
    setFinalTxHint("等待匹配本次目标链执行 tx");

    if (!originEmitter || originEmitter === "0x0000000000000000000000000000000000000000") {
      setDemoPhase("error");
      setStatusText("Origin 合约地址未配置，无法开始 demo。");
      return;
    }

    if (!isAddress(form.whale)) {
      setDemoPhase("error");
      setStatusText("请输入合法的巨鲸地址。");
      return;
    }

    const amountWei = parseEther(form.amount || "0");
    const pnlWei = parseSignedEther(form.pnl || "0");
    const tagHex = toBytes32(form.tag);

    try {
      setDemoPhase("wallet");
      setStatusText("等待钱包确认，确认后将发出本次 Origin tx。");
      appendStream({
        id: `request-${Date.now()}`,
        stage: "Input",
        title: "本次将要发出的巨鲸事件",
        detail: `whale=${truncate(form.whale)} | amount=${form.amount} ETH | pnl=${form.pnl} ETH | tag=${form.tag}`,
        tone: "neutral"
      });

      try {
        const [recordCount, executionCount] = await Promise.all([
          client.readContract({
            address: whaleDataVault as `0x${string}`,
            abi: whaleDataVaultAbi,
            functionName: "getRecordCount"
          }),
          client.readContract({
            address: strategyExecutor as `0x${string}`,
            abi: strategyExecutorAbi,
            functionName: "getExecutionCount"
          })
        ]);
        scanStartRef.current = { recordCount, executionCount };
      } catch {
        scanStartRef.current = null;
      }

      const hash = await emitWriter.writeContractAsync({
        address: originEmitter as `0x${string}`,
        abi: mockWhaleEmitterAbi,
        functionName: "emitMockTrade",
        args: [form.whale as `0x${string}`, BigInt(form.sourceChainId || chainId), amountWei, pnlWei, tagHex]
      });

      setEmitHash(hash);
      setPendingDemo({
        whale: form.whale,
        sourceChainId: form.sourceChainId,
        amountWei,
        pnlWei,
        tagHex,
        tagText: form.tag,
        originTxHash: hash
      });
      setDemoPhase("origin");
      setStatusText("Origin tx 已发出，现在开始根据这次 tx 去匹配目标链结果。");
      appendStream({
        id: `origin-${Date.now()}`,
        stage: "Origin",
        title: "Origin 异动已发出",
        detail: `origin tx: ${hash}`,
        tone: "good"
      });
    } catch (error) {
      setDemoPhase("error");
      setStatusText(error instanceof Error ? error.message : "交易发送失败");
      appendStream({
        id: `error-${Date.now()}`,
        stage: "Error",
        title: "本次调用失败",
        detail: error instanceof Error ? error.message : "交易发送失败",
        tone: "warn"
      });
    }
  };

  const txLink = emitHash ? `${explorerBase}/tx/${emitHash}` : null;
  const destinationTxLink = matchedDestinationActivity ? `${explorerBase}/tx/${matchedDestinationActivity.txHash}` : null;
  const currentModeLabel = mode.toUpperCase();
  const strategyCards = ["HEDGE", "GRID", "OBSERVE", "PAUSED"] as const;

  return (
    <section className="flex flex-col gap-6">
      <article className="panel-strong p-8 md:p-10">
        <p className="text-xs uppercase tracking-[0.4em] text-forest/70">Demo Overview</p>
        <h1 className="mt-4 max-w-5xl font-display text-4xl font-semibold leading-tight md:text-6xl">
          这个 Demo 用来模拟一笔巨鲸异动，被 Reactive 监听后回调到目标链执行策略。
        </h1>
        <p className="mt-5 max-w-4xl text-lg leading-8 text-ink/72">
          这次页面不会再展示全局最新数据，而是严格围绕你刚刚发出的 Origin tx，去匹配对应的目标链记录、策略执行结果和 destination tx。
        </p>
      </article>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="panel p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-ink/55">Step 1</p>
              <h2 className="mt-2 font-display text-2xl font-semibold">填写本次要监听 / 模拟的巨鲸事件</h2>
            </div>
            <ConnectButton showBalance={false} />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-ink/70"><span>Whale 地址</span><input className="w-full rounded-2xl border border-black/10 bg-white/90 px-4 py-3" value={form.whale} onChange={(event) => setForm((prev) => ({ ...prev, whale: event.target.value }))} /></label>
            <label className="space-y-2 text-sm text-ink/70"><span>Source Chain ID</span><input className="w-full rounded-2xl border border-black/10 bg-white/90 px-4 py-3" value={form.sourceChainId} onChange={(event) => setForm((prev) => ({ ...prev, sourceChainId: event.target.value }))} /></label>
            <label className="space-y-2 text-sm text-ink/70"><span>Amount (ETH)</span><input className="w-full rounded-2xl border border-black/10 bg-white/90 px-4 py-3" value={form.amount} onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))} /></label>
            <label className="space-y-2 text-sm text-ink/70"><span>PnL (ETH)</span><input className="w-full rounded-2xl border border-black/10 bg-white/90 px-4 py-3" value={form.pnl} onChange={(event) => setForm((prev) => ({ ...prev, pnl: event.target.value }))} /></label>
          </div>
          <label className="mt-4 block space-y-2 text-sm text-ink/70"><span>Tag</span><input className="w-full rounded-2xl border border-black/10 bg-white/90 px-4 py-3" value={form.tag} onChange={(event) => setForm((prev) => ({ ...prev, tag: event.target.value }))} /></label>
          <div className="mt-6 flex flex-wrap gap-3">
            {chainMismatch ? <button onClick={() => switchChain({ chainId })} className="rounded-full border border-ember/40 bg-ember/10 px-4 py-2 text-sm font-semibold text-ember">{isSwitching ? "切换中..." : `切换到链 ${chainId}`}</button> : null}
            <button onClick={handleRunDemo} disabled={Boolean(disableReason)} className="rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">{emitWriter.isPending ? "发送中..." : "开始监听并模拟巨鲸"}</button>
          </div>
          <div className="mt-4 rounded-2xl border border-black/5 bg-white/80 p-4 text-sm text-ink/72">
            <p>当前状态：{statusText}</p>
            {disableReason ? <p className="mt-2 text-ember">按钮不可用原因：{disableReason}</p> : null}
            {txLink ? <a className="mt-2 inline-block text-ocean underline" href={txLink} target="_blank" rel="noreferrer">查看本次 Origin tx</a> : null}
          </div>
        </article>

        <article className="panel p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-ink/55">Step 2</p>
          <h2 className="mt-2 font-display text-2xl font-semibold">这次异动的数据流</h2>
          <div className="mt-6 space-y-3">
            {stream.length === 0 ? <div className="rounded-2xl border border-dashed border-black/10 bg-mist/70 p-6 text-sm text-ink/60">点击左侧按钮后，这里只展示本次 tx 对应的链路。</div> : stream.map((item) => (
              <div key={item.id} className={`rounded-2xl border p-4 ${item.tone === "good" ? "border-forest/20 bg-tide/20" : item.tone === "warn" ? "border-ember/20 bg-ember/10" : "border-black/5 bg-white/80"}`}>
                <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-forest">{item.title}</p><span className="rounded-full bg-white px-3 py-1 text-xs uppercase tracking-[0.2em] text-ink/55">{item.stage}</span></div>
                <p className="mt-2 text-sm text-ink/72">{item.detail}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <article className="panel p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-ink/55">Step 3</p>
          <h2 className="mt-2 font-display text-2xl font-semibold">本次 Origin tx 对应的目标链记录</h2>
          <div>{matchedRecord?3:0}</div>
          {matchedRecord ? (
            <div className="mt-6 overflow-hidden rounded-3xl border border-black/5 bg-white/80">
              <table className="w-full text-left text-sm text-ink/75"><tbody>
                <tr className="border-b border-black/5"><th className="px-4 py-3 font-medium text-ink/55">Whale</th><td className="px-4 py-3">{matchedRecord.whale}</td></tr>
                <tr className="border-b border-black/5"><th className="px-4 py-3 font-medium text-ink/55">Source Chain</th><td className="px-4 py-3">{matchedRecord.chainId}</td></tr>
                <tr className="border-b border-black/5"><th className="px-4 py-3 font-medium text-ink/55">Amount</th><td className="px-4 py-3">{matchedRecord.amount} ETH</td></tr>
                <tr className="border-b border-black/5"><th className="px-4 py-3 font-medium text-ink/55">PnL</th><td className="px-4 py-3">{matchedRecord.pnl} ETH</td></tr>
                <tr className="border-b border-black/5"><th className="px-4 py-3 font-medium text-ink/55">Tag</th><td className="px-4 py-3">{decodeTag(matchedRecord.strategyTag)}</td></tr>
                <tr><th className="px-4 py-3 font-medium text-ink/55">Timestamp</th><td className="px-4 py-3">{matchedRecord.timestamp}</td></tr>
              </tbody></table>
            </div>
          ) : <div className="mt-6 rounded-2xl border border-dashed border-black/10 bg-mist/70 p-6 text-sm text-ink/60">正在根据这次 Origin tx 匹配目标链记录。</div>}
          {matchedDestinationActivity ? (
            <div className="mt-4 rounded-2xl border border-black/5 bg-mist/70 p-4 text-sm text-ink/72">
              <p className="font-semibold text-forest">这次匹配到的目标链交易</p>
              <p className="mt-2">Type: {matchedDestinationActivity.type}</p>
              <p>Mode: {matchedDestinationActivity.mode}</p>
              <p>Amount: {matchedDestinationActivity.amount} ETH</p>
              <p>Target: {matchedDestinationActivity.target}</p>
              <p className="break-all">Tx: {matchedDestinationActivity.txHash}</p>
              {destinationTxLink ? <a className="mt-2 inline-block text-ocean underline" href={destinationTxLink} target="_blank" rel="noreferrer">在 Scan 中打开 Destination tx</a> : null}
            </div>
          ) : null}
        </article>

        <article className="panel p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-ink/55">Step 4</p>
          <h2 className="mt-2 font-display text-2xl font-semibold">本次策略执行结果</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {strategyCards.map((name) => {
              const isActive = currentModeLabel === name;
              const isLoading = ["reactive", "destination"].includes(demoPhase);
              return <div key={name} className={`rounded-2xl border p-5 ${isActive ? "border-forest/30 bg-forest text-white shadow-glow" : "border-black/5 bg-white/80 text-ink"}`}><div className="flex items-center justify-between gap-3"><p className="text-lg font-semibold">{name}</p><span className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] ${isActive ? "bg-white/15 text-white" : "bg-mist text-forest"}`}>{isActive ? "final" : isLoading ? "loading" : "standby"}</span></div></div>;
            })}
          </div>
          <div className="mt-6 space-y-3 text-sm text-ink/75">
            <div className="rounded-2xl border border-black/5 bg-mist/70 p-4">策略执行状态：{actionHint}</div>
            <div className="rounded-2xl border border-black/5 bg-mist/70 p-4">最终链上模式：{mode}</div>
            <div className="rounded-2xl border border-black/5 bg-mist/70 p-4">跟单执行状态：{finalTxHint}</div>
            {matchedExecution ? <div className="rounded-2xl border border-black/5 bg-white/80 p-4"><p className="font-semibold text-forest">这次策略执行结果</p><div className="mt-3 grid gap-2 text-sm text-ink/72"><p>Whale: {matchedExecution.whale}</p><p>Amount: {matchedExecution.amount} ETH</p><p>Mode: {matchedExecution.mode}</p><p>Reason: {matchedExecution.reason}</p><p>Timestamp: {matchedExecution.timestamp}</p></div></div> : null}
            {matchedDestinationActivity && destinationTxLink ? <a className="inline-block text-ocean underline" href={destinationTxLink} target="_blank" rel="noreferrer">查看这次目标链执行 tx</a> : null}
          </div>
        </article>
      </section>
    </section>
  );
}
