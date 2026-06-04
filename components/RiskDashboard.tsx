"use client";
import { useState, useEffect } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Trash2, Shield, TrendingUp, Calculator, Clock, List, Target } from "lucide-react";

type FirmRules = {
  accountSize: number;
  dailyLossPct: number;
  maxDDPct: number;
  profitTargetPct: number;
};

type Trade = {
  id: string;
  entryPrice: number;
  units: number;
  direction: "long" | "short";
  exitPrice: number | null;
  pnl: number | null;
  timestamp: number;
};

const DEFAULT_RULES: FirmRules = { accountSize: 50000, dailyLossPct: 2, maxDDPct: 4, profitTargetPct: 6 };
const APEX_RULES: FirmRules = { accountSize: 50000, dailyLossPct: 2, maxDDPct: 4, profitTargetPct: 6 };

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 2,
  }).format(n);
}
function fmtShort(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  }).format(n);
}
function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}
function getEstNow() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
}
function calcCutoffSeconds() {
  const now = getEstNow();
  const target = new Date(now);
  target.setHours(11, 0, 0, 0);
  const diff = Math.floor((target.getTime() - now.getTime()) / 1000);
  return diff > 0 ? diff : 0;
}
function formatSeconds(s: number) {
  const h = Math.floor(s / 3600).toString().padStart(2, "0");
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

const CARD: React.CSSProperties = {
  backgroundColor: "#0f0f1a",
  border: "1px solid #1a1a2e",
  borderRadius: "16px",
  padding: "28px",
  marginBottom: "24px",
};

const INPUT_BASE: React.CSSProperties = {
  width: "100%",
  backgroundColor: "#0c0c18",
  border: "1px solid #1a1a2e",
  borderRadius: "8px",
  padding: "12px 16px",
  height: "44px",
  color: "#f1f5f9",
  fontSize: "14px",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

function DarkInput(props: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean; tooltip?: string }) {
  const { hasError, tooltip, ...rest } = props;
  const [focused, setFocused] = useState(false);
  const input = (
    <input
      {...rest}
      style={{
        ...INPUT_BASE,
        ...(focused ? { borderColor: "#4f8ef7", boxShadow: "0 0 0 2px rgba(79,142,247,0.2)" } : {}),
        ...(hasError ? { borderColor: "#ff4757" } : {}),
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
  if (!tooltip) return input;
  return (
    <div className="tip-wrap">
      <span className="tip">{tooltip}</span>
      {input}
    </div>
  );
}

function CardHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <span style={{ color: "#4f8ef7" }}>{icon}</span>
      <h3 className="text-lg font-bold tracking-wide text-white uppercase" style={{ letterSpacing: "0.05em", marginBottom: 0 }}>
        {title}
      </h3>
    </div>
  );
}

const GAUGE_R = 40;
const GAUGE_C = 2 * Math.PI * GAUGE_R;

export default function RiskDashboard() {
  const [rules, setRules] = useLocalStorage<FirmRules>("risk.dashboard.rules", DEFAULT_RULES);
  const [trades, setTrades] = useLocalStorage<Trade[]>("risk.dashboard.trades", []);
  const [tradingPaused, setTradingPaused] = useLocalStorage<boolean>("risk.dashboard.paused", false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [cutoffSec, setCutoffSec] = useState(calcCutoffSeconds);
  const [stopLoss, setStopLoss] = useState("");
  const [entry, setEntry] = useState("");
  const [units, setUnits] = useState("");
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [exitPrice, setExitPrice] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [preDirection, setPreDirection] = useState<"long" | "short">("long");
  const [rulesForm, setRulesForm] = useState<FirmRules>(rules);
  const [rulesErrors, setRulesErrors] = useState<Partial<Record<keyof FirmRules, string>>>({});
  const sectionRef = useScrollReveal<HTMLElement>();

  useEffect(() => { setRulesForm(rules); }, [rules.accountSize]);
  useEffect(() => {
    const id = setInterval(() => setCutoffSec(calcCutoffSeconds()), 1000);
    return () => clearInterval(id);
  }, []);

  const dailyLimit = (rules.accountSize * rules.dailyLossPct) / 100;
  const maxDD = (rules.accountSize * rules.maxDDPct) / 100;
  const profitTarget = (rules.accountSize * rules.profitTargetPct) / 100;
  const completedTrades = trades.filter((t) => t.pnl !== null);
  const dailyPnL = completedTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const wins = completedTrades.filter((t) => (t.pnl ?? 0) > 0).length;
  const losses = completedTrades.filter((t) => (t.pnl ?? 0) <= 0).length;
  const remaining = dailyLimit + dailyPnL;
  const usedPct = dailyLimit > 0 ? Math.min(100, (Math.abs(Math.min(0, dailyPnL)) / dailyLimit) * 100) : 0;
  const shouldShowBanner = dailyPnL <= -dailyLimit;
  const showBanner = shouldShowBanner && !bannerDismissed;
  const slNum = parseFloat(stopLoss);
  const maxUnits = slNum > 0 && remaining > 0 ? Math.floor(remaining / slNum) : null;
  const revTarget = currentPrice
    ? parseFloat(currentPrice) * (preDirection === "long" ? 1.03 : 0.97)
    : null;

  const addTrade = () => {
    const ep = parseFloat(entry);
    const u = parseFloat(units);
    if (!ep || ep <= 0 || !u || u <= 0) return;
    const ex = exitPrice ? parseFloat(exitPrice) : null;
    const pnl = ex !== null ? (ex - ep) * u * (direction === "long" ? 1 : -1) : null;
    const trade: Trade = {
      id: `${Date.now()}-${Math.random()}`,
      entryPrice: ep, units: u, direction, exitPrice: ex, pnl, timestamp: Date.now(),
    };
    const updated = [trade, ...trades];
    setTrades(updated);
    if (pnl !== null && dailyPnL + pnl <= -dailyLimit) {
      setTradingPaused(true);
      setBannerDismissed(false);
    }
    setEntry(""); setUnits(""); setExitPrice("");
  };

  const deleteTrade = (id: string) => setTrades(trades.filter((t) => t.id !== id));

  const saveRules = () => {
    const errs: Partial<Record<keyof FirmRules, string>> = {};
    if (!rulesForm.accountSize || rulesForm.accountSize <= 0) errs.accountSize = "Must be > 0";
    if (!rulesForm.dailyLossPct || rulesForm.dailyLossPct <= 0 || rulesForm.dailyLossPct >= 100)
      errs.dailyLossPct = "Must be 0–100";
    if (!rulesForm.maxDDPct || rulesForm.maxDDPct <= 0) errs.maxDDPct = "Must be > 0";
    if (!rulesForm.profitTargetPct || rulesForm.profitTargetPct <= 0) errs.profitTargetPct = "Must be > 0";
    setRulesErrors(errs);
    if (Object.keys(errs).length === 0) setRules(rulesForm);
  };

  const barColor = usedPct >= 90 ? "#ff4757" : usedPct >= 70 ? "#ffa502" : "#00d68f";
  const gaugeDash = GAUGE_C * (1 - Math.min(usedPct, 100) / 100);
  const timerColor = cutoffSec === 0 ? "#475569" : cutoffSec <= 1800 ? "#ff4757" : cutoffSec <= 3600 ? "#ffa502" : "#00d68f";
  const isUrgent = cutoffSec > 0 && cutoffSec <= 1800;

  const dirBtn = (d: "long" | "short", active: boolean) => ({
    backgroundColor: active ? (d === "long" ? "#00d68f" : "#ff4757") : "#1a1a2e",
    color: active ? "#ffffff" : "#6b7280",
  });

  return (
    <section ref={sectionRef} id="risk-dash" className="scroll-mt-24">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-white">Intraday Risk Dashboard</h2>
        <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
          Real-time position sizing, daily P&amp;L tracking, and market cutoff timer.
        </p>
      </div>

      {/* STOP BANNER */}
      {showBanner && (
        <div
          className="rounded-xl mb-6 px-6 py-5 flex items-center justify-between"
          style={{ backgroundColor: "#ff4757", border: "2px solid #cc2233" }}
        >
          <div>
            <p className="text-white text-2xl font-black tracking-widest">STOP TRADING</p>
            <p className="text-red-100 text-sm mt-1">Daily loss limit reached. Reset at 5pm EST.</p>
          </div>
          <button
            onClick={() => setBannerDismissed(true)}
            className="text-white font-bold text-3xl leading-none cursor-pointer hover:text-red-200 transition-colors duration-150"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* LEFT */}
        <div>
          {/* Firm Rules */}
          <div style={CARD} className="card-glow">
            <CardHeader icon={<Shield className="w-4 h-4" />} title="Firm Rules" />
            <div className="grid grid-cols-2 gap-6 mb-6">
              {([
                ["accountSize", "Account Size ($)", "Your funded account size"],
                ["dailyLossPct", "Daily Loss (%)", "Max daily drawdown % from your firm"],
                ["maxDDPct", "Max DD (%)", "Max trailing drawdown % allowed"],
                ["profitTargetPct", "Profit Target (%)", "Target % to pass the evaluation"],
              ] as [keyof FirmRules, string, string][]).map(([key, label, tip]) => (
                <div key={key}>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#6b7280" }}>
                    {label}
                  </label>
                  <DarkInput
                    type="number"
                    value={rulesForm[key]}
                    onChange={(e) => setRulesForm({ ...rulesForm, [key]: parseFloat(e.target.value) || 0 })}
                    hasError={!!rulesErrors[key]}
                    tooltip={tip}
                  />
                  {rulesErrors[key] && (
                    <p className="text-xs mt-0.5" style={{ color: "#ff4757" }}>{rulesErrors[key]}</p>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setRulesForm(APEX_RULES)}
                className="text-sm px-4 py-2 rounded-lg font-medium transition-colors duration-150 cursor-pointer"
                style={{ backgroundColor: "#1a1a2e", color: "#94a3b8", border: "1px solid #2a2a3e" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#2a2a3e")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#1a1a2e")}
              >
                Load Apex Intraday
              </button>
              <button
                onClick={saveRules}
                className="btn-primary text-sm px-4 py-2 rounded-lg font-bold text-white cursor-pointer"
                style={{ backgroundColor: "#4f8ef7" }}
              >
                Save Rules
              </button>
            </div>
          </div>

          {/* Daily P&L + Gauge */}
          <div style={CARD} className="card-glow">
            <CardHeader icon={<TrendingUp className="w-4 h-4" />} title="Daily P&amp;L" />
            <div className="flex items-start gap-6 mb-5">
              {/* Circular gauge */}
              <div className="flex flex-col items-center flex-shrink-0" style={{ minWidth: 80, minHeight: 80 }}>
                <div className="relative" style={{ width: 96, height: 96 }}>
                  <svg width="96" height="96" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r={GAUGE_R} fill="none" stroke="#1a1a2e" strokeWidth="8" />
                    <circle
                      cx="48" cy="48" r={GAUGE_R}
                      fill="none"
                      stroke={barColor}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={GAUGE_C}
                      strokeDashoffset={gaugeDash}
                      transform="rotate(-90 48 48)"
                      style={{ transition: "stroke-dashoffset 0.5s ease-out, stroke 0.3s ease" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="mono font-black text-sm" style={{ color: barColor }}>
                      {usedPct.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <span className="mono text-xs block" style={{ color: "#475569", marginTop: "8px" }}>used</span>
              </div>
              {/* Big P&L number */}
              <div>
                <div
                  className="mono font-black"
                  style={{ fontSize: "2.5rem", lineHeight: 1, color: dailyPnL >= 0 ? "#00d68f" : "#ff4757" }}
                >
                  {dailyPnL >= 0 ? "+" : ""}{fmtShort(dailyPnL)}
                </div>
                <div className="text-xs mt-1.5" style={{ color: "#6b7280" }}>
                  vs −{fmtShort(dailyLimit)} limit
                </div>
                <div className="text-xs mt-0.5" style={{ color: "#334155" }}>
                  Buffer: {fmtShort(remaining)} · Target: {fmtShort(profitTarget)}
                </div>
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ paddingTop: "16px", paddingBottom: "8px" }}>
              <div
                className="shimmer-bar rounded-full"
                style={{ backgroundColor: "#1a1a2e", height: "14px" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${usedPct}%`, backgroundColor: barColor }}
                />
              </div>
            </div>
          </div>

          {/* Position Sizer */}
          <div style={CARD} className="card-glow">
            <CardHeader icon={<Calculator className="w-4 h-4" />} title="Max Units Calculator" />
            <div className="mb-4">
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#6b7280" }}>
                Stop Loss per Unit ($)
              </label>
              <DarkInput
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="e.g. 50"
                tooltip="Your per-trade stop loss in dollars"
              />
            </div>
            <div className="flex justify-between text-sm mb-4" style={{ color: "#6b7280" }}>
              <span>Remaining Buffer</span>
              <span className="mono font-bold text-white">{fmtShort(remaining)}</span>
            </div>
            {/* Terminal box */}
            <div
              className="rounded-xl p-5 text-center"
              style={{
                backgroundColor: "#080810",
                border: `1px solid ${maxUnits !== null ? "rgba(0,214,143,0.25)" : "#1a1a2e"}`,
                boxShadow: maxUnits !== null ? "0 0 24px rgba(0,214,143,0.06)" : "none",
              }}
            >
              <p
                className="text-xs uppercase tracking-widest mb-2 font-semibold"
                style={{ color: "#334155", letterSpacing: "0.15em" }}
              >
                MAX UNITS
              </p>
              <p
                className="mono font-black"
                style={{ fontSize: "4rem", lineHeight: 1, color: maxUnits !== null ? "#00d68f" : "#1e293b" }}
              >
                {maxUnits !== null ? maxUnits : "—"}
              </p>
              {maxUnits !== null && (
                <p className="text-xs mt-2" style={{ color: "#475569" }}>
                  contracts · buffer ÷ stop loss
                </p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div>
          {/* Cutoff Timer */}
          <div
            style={CARD}
            className={`card-glow${isUrgent ? " pulse-urgent" : ""}`}
          >
            <CardHeader icon={<Clock className="w-4 h-4" />} title="Market Cutoff (11am EST)" />
            {cutoffSec > 0 ? (
              <div
                className="rounded-xl text-center"
                style={{
                  backgroundColor: "#080810",
                  border: `1px solid ${timerColor}30`,
                  padding: "28px 24px",
                }}
              >
                <p
                  className="mono font-black tracking-tight leading-none"
                  style={{ fontSize: "3.5rem", color: timerColor }}
                >
                  {formatSeconds(cutoffSec)}
                </p>
                {cutoffSec <= 3600 && (
                  <p className="text-xs mt-3 font-semibold" style={{ color: timerColor }}>
                    {cutoffSec <= 1800
                      ? "Under 30 min — close open positions"
                      : "Under 1 hour remaining"}
                  </p>
                )}
              </div>
            ) : (
              <div
                className="rounded-lg px-4 py-3 text-sm font-medium"
                style={{ backgroundColor: "#1a1a2e", color: "#6b7280" }}
              >
                Trading window closed for the day
              </div>
            )}
          </div>

          {/* Trade Log */}
          <div style={CARD} className="card-glow">
            <CardHeader icon={<List className="w-4 h-4" />} title="Trade Log" />
            <div className="grid grid-cols-2 gap-6 mb-5">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#6b7280" }}>Entry Price</label>
                <DarkInput type="number" value={entry} onChange={(e) => setEntry(e.target.value)} placeholder="0.00" tooltip="Price you entered the trade" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#6b7280" }}>Units</label>
                <DarkInput type="number" value={units} onChange={(e) => setUnits(e.target.value)} placeholder="1" tooltip="Number of contracts traded" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#6b7280" }}>Direction</label>
                <div className="flex gap-2">
                  {(["long", "short"] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDirection(d)}
                      className="flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-150 cursor-pointer capitalize"
                      style={dirBtn(d, direction === d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#6b7280" }}>Exit Price (opt.)</label>
                <DarkInput type="number" value={exitPrice} onChange={(e) => setExitPrice(e.target.value)} placeholder="optional" tooltip="Leave blank for open trades" />
              </div>
            </div>
            <button
              onClick={addTrade}
              className="btn-primary w-full text-white text-sm font-bold px-4 py-2.5 rounded-lg cursor-pointer mb-4"
              style={{ backgroundColor: "#4f8ef7" }}
            >
              Add Trade
            </button>

            {trades.length > 0 && (
              <div className="flex justify-between items-center mb-3">
                <span className="mono font-bold" style={{ color: dailyPnL >= 0 ? "#00d68f" : "#ff4757" }}>
                  Running: {dailyPnL >= 0 ? "+" : ""}{fmtShort(dailyPnL)}
                </span>
                <span className="text-sm" style={{ color: "#6b7280" }}>W: {wins} | L: {losses}</span>
              </div>
            )}

            {trades.length === 0 ? (
              <p className="text-sm italic" style={{ color: "#334155" }}>No trades logged yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1a1a2e" }}>
                      {["#", "Entry", "Units", "Dir", "Exit", "P&L", "Time", ""].map((h, i) => (
                        <th key={i} className={`pb-2 font-semibold ${i < 2 || i === 3 ? "text-left" : i === 7 ? "" : "text-right"}`} style={{ color: "#334155" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((t, i) => (
                      <tr
                        key={t.id}
                        className="group transition-colors duration-150"
                        style={{
                          borderBottom: "1px solid #12121e",
                          backgroundColor: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                        }}
                      >
                        <td className="py-2 mono" style={{ color: "#334155" }}>{trades.length - i}</td>
                        <td className="py-2 text-right mono" style={{ color: "#94a3b8" }}>{t.entryPrice}</td>
                        <td className="py-2 text-right mono" style={{ color: "#94a3b8" }}>{t.units}</td>
                        <td className="py-2 text-center">
                          <span
                            className="px-1.5 py-0.5 rounded text-xs font-bold mono"
                            style={{
                              backgroundColor: t.direction === "long" ? "rgba(0,214,143,0.12)" : "rgba(255,71,87,0.12)",
                              color: t.direction === "long" ? "#00d68f" : "#ff4757",
                            }}
                          >
                            {t.direction === "long" ? "L" : "S"}
                          </span>
                        </td>
                        <td className="py-2 text-right mono" style={{ color: "#94a3b8" }}>{t.exitPrice ?? "—"}</td>
                        <td
                          className="py-2 text-right font-bold mono"
                          style={{ color: t.pnl === null ? "#334155" : t.pnl >= 0 ? "#00d68f" : "#ff4757" }}
                        >
                          {t.pnl === null ? "—" : (t.pnl >= 0 ? "+" : "") + fmt(t.pnl)}
                        </td>
                        <td className="py-2 text-right mono" style={{ color: "#334155" }}>{fmtTime(t.timestamp)}</td>
                        <td className="py-2 pl-2">
                          <button
                            onClick={() => deleteTrade(t.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer"
                            style={{ color: "#ff4757" }}
                            aria-label="Delete trade"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pre-Open Setup */}
          <div style={CARD} className="card-glow">
            <CardHeader icon={<Target className="w-4 h-4" />} title="Pre-Open Setup" />
            <div className="grid grid-cols-2 gap-6 mb-5">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#6b7280" }}>Current Price</label>
                <DarkInput
                  type="number"
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(e.target.value)}
                  placeholder="e.g. 18500"
                  tooltip="Current market price before the open"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#6b7280" }}>Direction</label>
                <div className="flex gap-2">
                  {(["long", "short"] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setPreDirection(d)}
                      className="flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-150 cursor-pointer capitalize"
                      style={dirBtn(d, preDirection === d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Side-by-side large display */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div
                className="rounded-xl text-center flex flex-col items-center justify-center"
                style={{ backgroundColor: "#080810", border: "1px solid #1a1a2e", minHeight: 100, padding: "20px 16px" }}
              >
                <p className="text-xs uppercase font-semibold mb-2" style={{ color: "#334155", letterSpacing: "0.12em" }}>
                  Pre-Open
                </p>
                <p
                  className="mono font-black"
                  style={{ fontSize: "1.5rem", color: currentPrice ? "#f1f5f9" : "#1e293b", lineHeight: 1 }}
                >
                  {currentPrice ? `$${parseFloat(currentPrice).toLocaleString()}` : "—"}
                </p>
              </div>
              <div
                className="rounded-xl text-center flex flex-col items-center justify-center"
                style={{
                  backgroundColor: "#080810",
                  border: `1px solid ${revTarget ? "rgba(79,142,247,0.25)" : "#1a1a2e"}`,
                  minHeight: 100,
                  padding: "20px 16px",
                }}
              >
                <p className="text-xs uppercase font-semibold mb-2" style={{ color: "#334155", letterSpacing: "0.12em" }}>
                  3% Target
                </p>
                <p
                  className="mono font-black"
                  style={{ fontSize: "1.5rem", color: revTarget ? "#4f8ef7" : "#1e293b", lineHeight: 1 }}
                >
                  {revTarget ? `$${revTarget.toFixed(0)}` : "—"}
                </p>
              </div>
            </div>

            <button
              onClick={() => { setCurrentPrice(""); setPreDirection("long"); }}
              className="text-sm px-4 py-2 rounded-lg font-medium transition-colors duration-150 cursor-pointer"
              style={{ backgroundColor: "#1a1a2e", color: "#6b7280", border: "1px solid #2a2a3e" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#2a2a3e")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#1a1a2e")}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
