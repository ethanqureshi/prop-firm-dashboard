"use client";
import { useState, useEffect, useRef } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Trash2 } from "lucide-react";

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
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
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

export default function RiskDashboard() {
  const [rules, setRules] = useLocalStorage<FirmRules>("risk.dashboard.rules", DEFAULT_RULES);
  const [trades, setTrades] = useLocalStorage<Trade[]>("risk.dashboard.trades", []);
  const [tradingPaused, setTradingPaused] = useLocalStorage<boolean>("risk.dashboard.paused", false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [cutoffSec, setCutoffSec] = useState(calcCutoffSeconds);
  const [stopLoss, setStopLoss] = useState("");

  // Trade form
  const [entry, setEntry] = useState("");
  const [units, setUnits] = useState("");
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [exitPrice, setExitPrice] = useState("");

  // Pre-open
  const [currentPrice, setCurrentPrice] = useState("");
  const [preDirection, setPreDirection] = useState<"long" | "short">("long");

  // Rules form state
  const [rulesForm, setRulesForm] = useState(rules);
  const [rulesErrors, setRulesErrors] = useState<Partial<Record<keyof FirmRules, string>>>({});

  useEffect(() => { setRulesForm(rules); }, [rules.accountSize]);

  // Cutoff timer
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
  const maxUnits =
    slNum > 0 && remaining > 0 ? Math.floor(remaining / slNum) : null;

  const revTarget =
    currentPrice
      ? parseFloat(currentPrice) * (preDirection === "long" ? 1.03 : 0.97)
      : null;

  const addTrade = () => {
    const ep = parseFloat(entry);
    const u = parseFloat(units);
    if (!ep || ep <= 0 || !u || u <= 0) return;
    const ex = exitPrice ? parseFloat(exitPrice) : null;
    const pnl =
      ex !== null ? (ex - ep) * u * (direction === "long" ? 1 : -1) : null;
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
    if (!rulesForm.profitTargetPct || rulesForm.profitTargetPct <= 0) errs.profitTargetPct = "Must be > 0";
    setRulesErrors(errs);
    if (Object.keys(errs).length === 0) setRules(rulesForm);
  };

  const barColor =
    usedPct >= 90 ? "bg-red-500" : usedPct >= 70 ? "bg-amber-500" : "bg-emerald-500";

  const timerColor =
    cutoffSec === 0
      ? "text-slate-400"
      : cutoffSec <= 1800
      ? "text-red-400"
      : cutoffSec <= 3600
      ? "text-amber-400"
      : "text-slate-300";

  const inputCls = "w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-slate-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors duration-150";
  const cardCls = "bg-slate-900 border border-slate-700 rounded-lg p-4 mb-4";

  return (
    <section id="risk-dash" className="scroll-mt-20">
      <h2 className="text-2xl font-bold text-slate-100 mb-6">Intraday Risk Dashboard</h2>

      {showBanner && (
        <div className="bg-red-600 border-b-2 border-red-700 text-white px-6 py-3 rounded-lg mb-4 flex items-center justify-between">
          <span className="font-semibold">
            STOP TRADING — Daily loss limit reached. Reset at 5pm EST.
          </span>
          <button
            onClick={() => setBannerDismissed(true)}
            className="ml-4 text-white hover:text-red-200 font-bold text-lg leading-none cursor-pointer"
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
          <div className={cardCls}>
            <h3 className="text-lg font-semibold text-slate-100 mb-3">Firm Rules</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {([
                ["accountSize", "Account Size ($)"],
                ["dailyLossPct", "Daily Loss (%)"],
                ["maxDDPct", "Max DD (%)"],
                ["profitTargetPct", "Profit Target (%)"],
              ] as [keyof FirmRules, string][]).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
                  <input
                    type="number"
                    value={rulesForm[key]}
                    onChange={(e) => setRulesForm({ ...rulesForm, [key]: parseFloat(e.target.value) || 0 })}
                    className={`${inputCls} text-sm ${ rulesErrors[key] ? "border-red-500" : "" }`}
                  />
                  {rulesErrors[key] && <p className="text-red-400 text-xs mt-0.5">{rulesErrors[key]}</p>}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setRulesForm(APEX_RULES)}
                className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm px-3 py-1.5 rounded font-medium transition-colors duration-150 cursor-pointer"
              >
                Load Apex Intraday
              </button>
              <button
                onClick={saveRules}
                className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm px-3 py-1.5 rounded font-medium transition-all duration-150 cursor-pointer"
              >
                Save Rules
              </button>
            </div>
          </div>

          {/* Daily P&L */}
          <div className={cardCls}>
            <h3 className="text-lg font-semibold text-slate-100 mb-3">Daily P&amp;L</h3>
            <div className="flex justify-between text-sm text-slate-300 mb-2">
              <span>
                <span className={dailyPnL >= 0 ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>
                  {fmt(dailyPnL)}
                </span>
                {" "}/&nbsp;<span className="text-slate-400">-{fmt(dailyLimit)} limit</span>
              </span>
              <span className="text-slate-400">{usedPct.toFixed(1)}% used</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-300 ease-out ${barColor}`}
                style={{ width: `${usedPct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Buffer: {fmt(remaining)}</span>
              <span>Target: {fmt(profitTarget)}</span>
            </div>
          </div>

          {/* Position Sizer */}
          <div className={cardCls}>
            <h3 className="text-lg font-semibold text-slate-100 mb-3">Max Units Calculator</h3>
            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-400 mb-1">Stop Loss ($)</label>
              <input
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="e.g. 50"
                className={`${inputCls} text-sm`}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Remaining Buffer</span>
              <span className="text-slate-200 font-medium">{fmt(remaining)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-slate-400">Max Units</span>
              <span className={maxUnits !== null ? "text-emerald-400 font-bold text-lg" : "text-slate-500"}>
                {maxUnits !== null ? maxUnits : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div>
          {/* Cutoff Timer */}
          <div className={cardCls}>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Market Cutoff (11am EST)</h3>
            {cutoffSec > 0 ? (
              <p className={`text-3xl font-mono font-bold ${timerColor}`}>{formatSeconds(cutoffSec)}</p>
            ) : (
              <div className="bg-slate-700 rounded px-3 py-2 text-slate-300 text-sm font-medium">
                Trading window closed for the day
              </div>
            )}
          </div>

          {/* Trade Log */}
          <div className={cardCls}>
            <h3 className="text-lg font-semibold text-slate-100 mb-3">Trade Log</h3>
            {/* Form */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Entry Price</label>
                <input type="number" value={entry} onChange={(e) => setEntry(e.target.value)}
                  placeholder="0.00" className={`${inputCls} text-sm`} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Units</label>
                <input type="number" value={units} onChange={(e) => setUnits(e.target.value)}
                  placeholder="1" className={`${inputCls} text-sm`} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Direction</label>
                <div className="flex gap-2">
                  {(["long", "short"] as const).map((d) => (
                    <button key={d} onClick={() => setDirection(d)}
                      className={`flex-1 py-2 rounded text-sm font-medium transition-all duration-150 cursor-pointer capitalize ${
                        direction === d
                          ? d === "long" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
                          : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                      }`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Exit Price (opt.)</label>
                <input type="number" value={exitPrice} onChange={(e) => setExitPrice(e.target.value)}
                  placeholder="optional" className={`${inputCls} text-sm`} />
              </div>
            </div>
            <button onClick={addTrade}
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm px-4 py-2 rounded font-medium transition-all duration-150 cursor-pointer mb-4">
              Add Trade
            </button>

            {/* Stats */}
            {trades.length > 0 && (
              <div className="flex justify-between items-center mb-2">
                <span className={`text-base font-semibold ${ dailyPnL >= 0 ? "text-emerald-400" : "text-red-400" }`}>
                  Running: {dailyPnL >= 0 ? "+" : ""}{fmt(dailyPnL)}
                </span>
                <span className="text-sm text-slate-400">W: {wins} | L: {losses}</span>
              </div>
            )}

            {/* Table */}
            {trades.length === 0 ? (
              <p className="text-slate-500 italic text-sm">No trades logged yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-700">
                      <th className="text-left pb-1.5 font-medium">#</th>
                      <th className="text-right pb-1.5 font-medium">Entry</th>
                      <th className="text-right pb-1.5 font-medium">Units</th>
                      <th className="text-center pb-1.5 font-medium">Dir</th>
                      <th className="text-right pb-1.5 font-medium">Exit</th>
                      <th className="text-right pb-1.5 font-medium">P&amp;L</th>
                      <th className="text-right pb-1.5 font-medium">Time</th>
                      <th className="pb-1.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((t, i) => (
                      <tr key={t.id} className="border-b border-slate-800 hover:bg-slate-700/30 group transition-colors duration-150">
                        <td className="py-1.5 text-slate-500">{trades.length - i}</td>
                        <td className="py-1.5 text-right text-slate-300">{t.entryPrice}</td>
                        <td className="py-1.5 text-right text-slate-300">{t.units}</td>
                        <td className="py-1.5 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                            t.direction === "long" ? "bg-emerald-950 text-emerald-400" : "bg-red-950 text-red-400"
                          }`}>{t.direction === "long" ? "L" : "S"}</span>
                        </td>
                        <td className="py-1.5 text-right text-slate-300">{t.exitPrice ?? "—"}</td>
                        <td className={`py-1.5 text-right font-medium ${
                          t.pnl === null ? "text-slate-500" : t.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}>
                          {t.pnl === null ? "—" : (t.pnl >= 0 ? "+" : "") + fmt(t.pnl)}
                        </td>
                        <td className="py-1.5 text-right text-slate-500">{fmtTime(t.timestamp)}</td>
                        <td className="py-1.5 pl-2">
                          <button onClick={() => deleteTrade(t.id)}
                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-opacity duration-150 cursor-pointer"
                            aria-label="Delete trade">
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
          <div className={cardCls}>
            <h3 className="text-lg font-semibold text-slate-100 mb-3">Pre-Open Setup</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Current Price</label>
                <input type="number" value={currentPrice} onChange={(e) => setCurrentPrice(e.target.value)}
                  placeholder="e.g. 18500" className={`${inputCls} text-sm`} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Direction</label>
                <div className="flex gap-2">
                  {(["long", "short"] as const).map((d) => (
                    <button key={d} onClick={() => setPreDirection(d)}
                      className={`flex-1 py-2 rounded text-sm font-medium transition-all duration-150 cursor-pointer capitalize ${
                        preDirection === d
                          ? d === "long" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
                          : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                      }`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-between text-sm mb-3">
              <span className="text-slate-400">Reversion Target (3%)</span>
              <span className="text-blue-400 font-semibold font-mono">
                {revTarget ? `$${revTarget.toFixed(2)}` : "—"}
              </span>
            </div>
            <button
              onClick={() => { setCurrentPrice(""); setPreDirection("long"); }}
              className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm px-3 py-1.5 rounded font-medium transition-colors duration-150 cursor-pointer">
              Reset
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
