"use client";
import { useState, useEffect } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
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
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
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
  backgroundColor: "#111118",
  border: "1px solid #1e1e2e",
  borderRadius: "16px",
  padding: "20px",
  marginBottom: "20px",
};

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  backgroundColor: "#1a1a2e",
  border: "1px solid #1e1e2e",
  borderRadius: "8px",
  padding: "8px 12px",
  color: "#ffffff",
  fontSize: "14px",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

function DarkInput(props: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) {
  const { hasError, ...rest } = props;
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...rest}
      style={{
        ...INPUT_STYLE,
        ...(focused
          ? { borderColor: "#3b82f6", boxShadow: "0 0 0 2px rgba(59,130,246,0.25)" }
          : {}),
        ...(hasError ? { borderColor: "#ef4444" } : {}),
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function CardHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span style={{ color: "#3b82f6" }}>{icon}</span>
      <h3 className="text-base font-semibold text-white">{title}</h3>
    </div>
  );
}

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
      entryPrice: ep,
      units: u,
      direction,
      exitPrice: ex,
      pnl,
      timestamp: Date.now(),
    };
    const updated = [trade, ...trades];
    setTrades(updated);
    if (pnl !== null && dailyPnL + pnl <= -dailyLimit) {
      setTradingPaused(true);
      setBannerDismissed(false);
    }
    setEntry("");
    setUnits("");
    setExitPrice("");
  };

  const deleteTrade = (id: string) => {
    setTrades(trades.filter((t) => t.id !== id));
  };

  const saveRules = () => {
    const errs: Partial<Record<keyof FirmRules, string>> = {};
    if (!rulesForm.accountSize || rulesForm.accountSize <= 0) errs.accountSize = "Must be > 0";
    if (!rulesForm.dailyLossPct || rulesForm.dailyLossPct <= 0 || rulesForm.dailyLossPct >= 100)
      errs.dailyLossPct = "Must be 0–100";
    if (!rulesForm.maxDDPct || rulesForm.maxDDPct <= 0) errs.maxDDPct = "Must be > 0";
    if (!rulesForm.profitTargetPct || rulesForm.profitTargetPct <= 0)
      errs.profitTargetPct = "Must be > 0";
    setRulesErrors(errs);
    if (Object.keys(errs).length === 0) setRules(rulesForm);
  };

  const barColor =
    usedPct >= 90 ? "#ef4444" : usedPct >= 70 ? "#f59e0b" : "#10b981";

  const timerColor =
    cutoffSec === 0
      ? "#475569"
      : cutoffSec <= 1800
      ? "#ef4444"
      : cutoffSec <= 3600
      ? "#f59e0b"
      : "#10b981";

  return (
    <section id="risk-dash" className="scroll-mt-20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Intraday Risk Dashboard</h2>
        <p className="text-sm mt-1" style={{ color: "#64748b" }}>
          Real-time position sizing, daily P&amp;L tracking, and market cutoff timer.
        </p>
      </div>

      {/* STOP TRADING BANNER */}
      {showBanner && (
        <div
          className="rounded-xl mb-6 px-6 py-5 flex items-center justify-between"
          style={{ backgroundColor: "#ef4444", border: "2px solid #dc2626" }}
        >
          <div>
            <p className="text-white text-2xl font-black tracking-wide">STOP TRADING</p>
            <p className="text-red-100 text-sm mt-1">
              Daily loss limit reached. Reset at 5pm EST.
            </p>
          </div>
          <button
            onClick={() => setBannerDismissed(true)}
            className="text-white font-bold text-2xl leading-none cursor-pointer hover:text-red-200 transition-colors duration-150"
            aria-label="Dismiss banner"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN */}
        <div>
          {/* Firm Rules */}
          <div style={CARD}>
            <CardHeader icon={<Shield className="w-4 h-4" />} title="Firm Rules" />
            <div className="grid grid-cols-2 gap-3 mb-4">
              {([
                ["accountSize", "Account Size ($)"],
                ["dailyLossPct", "Daily Loss (%)"],
                ["maxDDPct", "Max DD (%)"],
                ["profitTargetPct", "Profit Target (%)"],
              ] as [keyof FirmRules, string][]).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748b" }}>
                    {label}
                  </label>
                  <DarkInput
                    type="number"
                    value={rulesForm[key]}
                    onChange={(e) =>
                      setRulesForm({ ...rulesForm, [key]: parseFloat(e.target.value) || 0 })
                    }
                    hasError={!!rulesErrors[key]}
                  />
                  {rulesErrors[key] && (
                    <p className="text-xs mt-0.5" style={{ color: "#ef4444" }}>
                      {rulesErrors[key]}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setRulesForm(APEX_RULES)}
                className="text-sm px-4 py-2 rounded-lg font-medium transition-colors duration-150 cursor-pointer"
                style={{ backgroundColor: "#1e1e2e", color: "#94a3b8", border: "1px solid #2a2a3e" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor = "#2a2a3e")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor = "#1e1e2e")
                }
              >
                Load Apex Intraday
              </button>
              <button
                onClick={saveRules}
                className="text-sm px-4 py-2 rounded-lg font-medium text-white transition-all duration-150 cursor-pointer"
                style={{ backgroundColor: "#3b82f6" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor = "#2563eb")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor = "#3b82f6")
                }
              >
                Save Rules
              </button>
            </div>
          </div>

          {/* Daily P&L */}
          <div style={CARD}>
            <CardHeader icon={<TrendingUp className="w-4 h-4" />} title="Daily P&amp;L" />
            <div
              className="text-5xl font-black font-mono mb-4"
              style={{ color: dailyPnL >= 0 ? "#10b981" : "#ef4444" }}
            >
              {dailyPnL >= 0 ? "+" : ""}{fmt(dailyPnL)}
            </div>
            <div className="flex justify-between text-sm mb-2" style={{ color: "#64748b" }}>
              <span>Limit: -{fmt(dailyLimit)}</span>
              <span>{usedPct.toFixed(1)}% used</span>
            </div>
            <div
              className="w-full rounded-full overflow-hidden"
              style={{ backgroundColor: "#1e1e2e", height: "12px" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${usedPct}%`, backgroundColor: barColor }}
              />
            </div>
            <div className="flex justify-between text-xs mt-2" style={{ color: "#334155" }}>
              <span>Buffer remaining: {fmt(remaining)}</span>
              <span>Profit target: {fmt(profitTarget)}</span>
            </div>
          </div>

          {/* Position Sizer */}
          <div style={CARD}>
            <CardHeader icon={<Calculator className="w-4 h-4" />} title="Max Units Calculator" />
            <div className="mb-4">
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748b" }}>
                Stop Loss per Unit ($)
              </label>
              <DarkInput
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="e.g. 50"
              />
            </div>
            <div className="flex justify-between text-sm mb-3" style={{ color: "#64748b" }}>
              <span>Remaining Buffer</span>
              <span className="text-white font-medium">{fmt(remaining)}</span>
            </div>
            <div
              className="rounded-xl p-4 text-center"
              style={{ backgroundColor: "#0a0a0f", border: "1px solid #1e1e2e" }}
            >
              <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "#475569" }}>
                Max Units
              </p>
              <p
                className="text-6xl font-black font-mono"
                style={{ color: maxUnits !== null ? "#10b981" : "#334155" }}
              >
                {maxUnits !== null ? maxUnits : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div>
          {/* Cutoff Timer */}
          <div style={CARD}>
            <CardHeader icon={<Clock className="w-4 h-4" />} title="Market Cutoff (11am EST)" />
            {cutoffSec > 0 ? (
              <p
                className="text-7xl font-black font-mono tracking-tight leading-none"
                style={{ color: timerColor }}
              >
                {formatSeconds(cutoffSec)}
              </p>
            ) : (
              <div
                className="rounded-lg px-4 py-3 text-sm font-medium"
                style={{ backgroundColor: "#1e1e2e", color: "#64748b" }}
              >
                Trading window closed for the day
              </div>
            )}
            {cutoffSec > 0 && cutoffSec <= 3600 && (
              <p className="text-sm mt-3" style={{ color: timerColor }}>
                {cutoffSec <= 1800 ? "Under 30 min — wrap up open positions" : "Under 1 hour remaining"}
              </p>
            )}
          </div>

          {/* Trade Log */}
          <div style={CARD}>
            <CardHeader icon={<List className="w-4 h-4" />} title="Trade Log" />
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748b" }}>
                  Entry Price
                </label>
                <DarkInput
                  type="number"
                  value={entry}
                  onChange={(e) => setEntry(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748b" }}>
                  Units
                </label>
                <DarkInput
                  type="number"
                  value={units}
                  onChange={(e) => setUnits(e.target.value)}
                  placeholder="1"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748b" }}>
                  Direction
                </label>
                <div className="flex gap-2">
                  {(["long", "short"] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDirection(d)}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer capitalize"
                      style={{
                        backgroundColor:
                          direction === d
                            ? d === "long"
                              ? "#10b981"
                              : "#ef4444"
                            : "#1e1e2e",
                        color: direction === d ? "#ffffff" : "#94a3b8",
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748b" }}>
                  Exit Price (opt.)
                </label>
                <DarkInput
                  type="number"
                  value={exitPrice}
                  onChange={(e) => setExitPrice(e.target.value)}
                  placeholder="optional"
                />
              </div>
            </div>
            <button
              onClick={addTrade}
              className="w-full text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-all duration-150 cursor-pointer mb-4"
              style={{ backgroundColor: "#3b82f6" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor = "#2563eb")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor = "#3b82f6")
              }
            >
              Add Trade
            </button>

            {trades.length > 0 && (
              <div className="flex justify-between items-center mb-3">
                <span
                  className="text-base font-bold"
                  style={{ color: dailyPnL >= 0 ? "#10b981" : "#ef4444" }}
                >
                  Running: {dailyPnL >= 0 ? "+" : ""}{fmt(dailyPnL)}
                </span>
                <span className="text-sm" style={{ color: "#64748b" }}>
                  W: {wins} | L: {losses}
                </span>
              </div>
            )}

            {trades.length === 0 ? (
              <p className="text-sm italic" style={{ color: "#334155" }}>
                No trades logged yet
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1e1e2e" }}>
                      {["#", "Entry", "Units", "Dir", "Exit", "P&L", "Time", ""].map((h, i) => (
                        <th
                          key={i}
                          className={`pb-2 font-medium ${
                            i === 0 || i === 3
                              ? "text-left"
                              : i === 7
                              ? ""
                              : "text-right"
                          }`}
                          style={{ color: "#334155" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((t, i) => (
                      <tr
                        key={t.id}
                        className="group transition-colors duration-150"
                        style={{
                          borderBottom: "1px solid #1a1a2e",
                          backgroundColor:
                            i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                        }}
                      >
                        <td className="py-2" style={{ color: "#334155" }}>
                          {trades.length - i}
                        </td>
                        <td className="py-2 text-right" style={{ color: "#94a3b8" }}>
                          {t.entryPrice}
                        </td>
                        <td className="py-2 text-right" style={{ color: "#94a3b8" }}>
                          {t.units}
                        </td>
                        <td className="py-2 text-center">
                          <span
                            className="px-1.5 py-0.5 rounded text-xs font-semibold"
                            style={{
                              backgroundColor:
                                t.direction === "long"
                                  ? "rgba(16,185,129,0.15)"
                                  : "rgba(239,68,68,0.15)",
                              color: t.direction === "long" ? "#10b981" : "#ef4444",
                            }}
                          >
                            {t.direction === "long" ? "L" : "S"}
                          </span>
                        </td>
                        <td className="py-2 text-right" style={{ color: "#94a3b8" }}>
                          {t.exitPrice ?? "—"}
                        </td>
                        <td
                          className="py-2 text-right font-semibold"
                          style={{
                            color:
                              t.pnl === null
                                ? "#334155"
                                : t.pnl >= 0
                                ? "#10b981"
                                : "#ef4444",
                          }}
                        >
                          {t.pnl === null
                            ? "—"
                            : (t.pnl >= 0 ? "+" : "") + fmt(t.pnl)}
                        </td>
                        <td className="py-2 text-right" style={{ color: "#334155" }}>
                          {fmtTime(t.timestamp)}
                        </td>
                        <td className="py-2 pl-2">
                          <button
                            onClick={() => deleteTrade(t.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer"
                            style={{ color: "#ef4444" }}
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
          <div style={CARD}>
            <CardHeader icon={<Target className="w-4 h-4" />} title="Pre-Open Setup" />
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748b" }}>
                  Current Price
                </label>
                <DarkInput
                  type="number"
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(e.target.value)}
                  placeholder="e.g. 18500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748b" }}>
                  Direction
                </label>
                <div className="flex gap-2">
                  {(["long", "short"] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setPreDirection(d)}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer capitalize"
                      style={{
                        backgroundColor:
                          preDirection === d
                            ? d === "long"
                              ? "#10b981"
                              : "#ef4444"
                            : "#1e1e2e",
                        color: preDirection === d ? "#ffffff" : "#94a3b8",
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div
              className="rounded-xl p-4 text-center mb-4"
              style={{ backgroundColor: "#0a0a0f", border: "1px solid #1e1e2e" }}
            >
              <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "#475569" }}>
                3% Reversion Target
              </p>
              <p
                className="text-4xl font-black font-mono"
                style={{ color: revTarget ? "#3b82f6" : "#334155" }}
              >
                {revTarget ? `$${revTarget.toFixed(2)}` : "—"}
              </p>
            </div>
            <button
              onClick={() => { setCurrentPrice(""); setPreDirection("long"); }}
              className="text-sm px-4 py-2 rounded-lg font-medium transition-colors duration-150 cursor-pointer"
              style={{ backgroundColor: "#1e1e2e", color: "#64748b", border: "1px solid #2a2a3e" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor = "#2a2a3e")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor = "#1e1e2e")
              }
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
