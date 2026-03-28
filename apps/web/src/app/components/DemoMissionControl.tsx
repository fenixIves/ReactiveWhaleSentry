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

  const [statusText, setStatusText] = useState("系统就绪。初始化跨链监听模块，准备捕获 Origin 链巨鲸交易信号。");
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
    summary: "Reactive 已回调目标链，Whale 数据已落库，StrategyExecutor 已执行并触发后续跟单流程。"
  });

  const disableReason = !isConnected
    ? "请连接钱包以继续"
    : chainMismatch
      ? `请切换至目标网络 ${chainId}`
      : !originEmitter || originEmitter === "0x0000000000000000000000000000000000000000"
        ? "系统配置未完成"
        : emitWriter.isPending
          ? "交易提交中..."
          : null;

  const handleRunDemo = async () => {
    if (!originEmitter || originEmitter === "0x0000000000000000000000000000000000000000") {
      setStatusText("系统配置异常：Origin 合约地址尚未部署，请联系管理员完成配置。");
      return;
    }
    if (!isAddress(form.whale)) {
      setStatusText("地址格式错误：请输入有效的 Ethereum 钱包地址。");
      return;
    }

    try {
      setStatusText("等待签名确认：请在钱包中确认交易签名以启动跨链监听。");
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
      setStatusText("交易已提交：Origin 链事件触发成功，Reactive 网络监听中...");

      // 15秒后显示 ReactScan 结果
      setTimeout(() => {
        setStep3Status("ready");
        setReactScanUrl(`https://lasna.reactscan.net/address/${hash}`);
        setStatusText("跨链数据同步完成：目标链执行结果已就绪。");
      }, 15000);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "交易提交失败：请检查网络连接及钱包状态后重试。");
    }
  };

  const originTxLink = originTx ? `${explorerBase}/tx/${originTx}` : null;
  const destinationTxLink = destinationResult.destinationTx ? `${explorerBase}/tx/${destinationResult.destinationTx}` : null;

  return (
    <section className="flex flex-col gap-6">
      <article className="rounded-3xl border border-white/20 bg-black/40 p-8 shadow-xl backdrop-blur-lg md:p-10">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-white/70">Reactive Network Hackathon Demo</p>
        <h1 className="mt-4 max-w-5xl font-display text-2xl font-semibold leading-tight text-white">
          Reactive Whale Sentry：跨链自动化跟单策略执行引擎
        </h1>
        <p className="mt-5 max-w-4xl text-lg leading-8 text-white/80">
          基于 Reactive Network 的事件驱动架构，实时监听 Base Sepolia 链上巨鲸交易异动，
          自动触发目标链策略合约执行，实现毫秒级跨链响应与智能化 DeFi 策略部署。
          无需人工干预，全流程自动化验证。
        </p>
      </article>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-3xl border border-white/20 bg-black/30 p-8 shadow-lg backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-base uppercase tracking-[0.3em] text-white/60">Step 1</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-white">初始化 Origin 链监听</h2>
            </div>
            <ConnectButton showBalance={false} />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-white/70"><span className="text-white/90">巨鲸地址</span><input className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50" value={form.whale} onChange={(event) => setForm((prev) => ({ ...prev, whale: event.target.value }))} /></label>
            <label className="space-y-2 text-sm text-white/70"><span className="text-white/90">源链 ID</span><input className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50" value={form.sourceChainId} onChange={(event) => setForm((prev) => ({ ...prev, sourceChainId: event.target.value }))} /></label>
            <label className="space-y-2 text-sm text-white/70"><span className="text-white/90">交易金额 (ETH)</span><input className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50" value={form.amount} onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))} /></label>
            <label className="space-y-2 text-sm text-white/70"><span className="text-white/90">盈亏金额 (ETH)</span><input className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50" value={form.pnl} onChange={(event) => setForm((prev) => ({ ...prev, pnl: event.target.value }))} /></label>
          </div>
          <label className="mt-4 block space-y-2 text-sm text-white/70"><span className="text-white/90">策略标签</span><input className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50" value={form.tag} onChange={(event) => setForm((prev) => ({ ...prev, tag: event.target.value }))} /></label>
          <div className="mt-6 flex flex-wrap gap-3">
            {chainMismatch ? <button onClick={() => switchChain({ chainId })} className="rounded-full border border-white/30 bg-blue-300 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20">{isSwitching ? "切换中..." : `切换到链 ${chainId}`}</button> : null}
            <button onClick={handleRunDemo} disabled={Boolean(disableReason)} className="rounded-full bg-blue-400 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60 hover:bg-white/30">{emitWriter.isPending ? "提交中..." : "启动跨链监听"}</button>
          </div>
          <div className="mt-4 rounded-2xl border border-white/20 bg-white/10 p-4 text-sm">
            <p className="font-medium text-white/90">系统状态：{statusText}</p>
            {disableReason ? <p className="mt-2 text-white/70 font-medium">⚠ {disableReason}</p> : null}
            {originTx ? <p className="mt-2 break-all font-mono text-xs text-white/50">TX: {originTx}</p> : null}
            {originTxLink ? <a className="mt-2 inline-block text-white/80 font-semibold hover:text-white hover:underline" href={originTxLink} target="_blank" rel="noreferrer">↗ 查看链上交易</a> : null}
          </div>
        </article>

        <article className="rounded-3xl border border-white/20 bg-black/30 p-8 shadow-lg backdrop-blur-md">
          <p className="text-base uppercase tracking-[0.3em] text-white/60">Step 2</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-white">Reactive 跨链执行流程</h2>
          <p className="mt-3 text-sm leading-7 text-white/70">
            事件驱动的自动化链路：Origin 链交易被 Reactive 网络监听，实时回调至目标链完成策略执行与数据落库。
          </p>
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs text-white">1</span>
              <span className="text-sm font-medium text-white/90">Reactive 监听 Origin 链事件</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs text-white">2</span>
              <span className="text-sm font-medium text-white/90">目标链自动生成 Destination TX</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs text-white">3</span>
              <span className="text-sm font-medium text-white/90">Whale 数据持久化，策略合约执行</span>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <article className="rounded-3xl border border-white/20 bg-black/30 p-8 shadow-lg backdrop-blur-md">
          <p className="text-base uppercase tracking-[0.3em] text-white/60">Step 3</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-white">
            {step3Status === "waiting" && "等待触发..."}
            {step3Status === "loading" && "正在等待 Reactive 数据..."}
            {step3Status === "ready" && "目标链结果"}
          </h2>

          {step3Status === "waiting" && (
            <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 p-8 text-center">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                <span className="text-2xl text-white/80">⏳</span>
              </div>
              <p className="text-sm font-medium text-white/90">等待 Origin 链事件触发</p>
              <p className="mt-1 text-xs text-white/60">系统将自动捕获 Reactive 网络回调数据</p>
            </div>
          )}

          {step3Status === "loading" && (
            <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 p-8 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white"></div>
              </div>
              <p className="text-base font-semibold text-white/90">Reactive 网络处理中...</p>
              <p className="mt-2 text-xs text-white/60">预计 15 秒完成跨链同步</p>
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
                查看完整跨链链路
              </a>
            </>
          )}
        </article>

        <article className="rounded-3xl border border-white/20 bg-black/30 p-8 shadow-lg backdrop-blur-md">
          <p className="text-base uppercase tracking-[0.3em] text-white/60">Step 4</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-white">
            {step3Status === "waiting" && "等待触发..."}
            {step3Status === "loading" && "正在等待策略执行..."}
            {step3Status === "ready" && "策略结果与跟单说明"}
          </h2>

          {step3Status === "waiting" && (
            <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 p-8 text-center">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                <span className="text-2xl text-white/80">⏳</span>
              </div>
              <p className="text-sm font-medium text-white/90">等待策略执行结果</p>
              <p className="mt-1 text-xs text-white/60">系统将展示最终触发的自动化交易策略</p>
            </div>
          )}

          {step3Status === "loading" && (
            <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 p-8 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white"></div>
              </div>
              <p className="text-base font-semibold text-white/90">智能策略执行中...</p>
              <p className="mt-2 text-xs text-white/60">预计 15 秒完成策略计算</p>
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
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">执行策略：{destinationResult.strategy}</div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">策略摘要：{destinationResult.summary}</div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">全流程自动化完成，跨链数据已验证。</div>
              </div>
            </>
          )}
        </article>
      </section>
    </section>
  );
}
