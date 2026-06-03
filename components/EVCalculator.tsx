"use client";
import { useState, useCallback } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { FIRMS } from "@/lib/firms";
import { runSimulation, type EVInput, type SimulationResult } from "@/lib/simulation";
import { Loader2 } from "lucide-react";

const DEFAULT_INPUT: EVInput = { totalTrades: 100, wins: 55, avgWin: 200, avgLoss: 150 };

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export default function EVCalculator() {
  const [input, setInput] = useLocalStorage<EVInput>("ev.calculator.input", DEFAULT_INPUT);
  const [results, setResults] = useState<SimulationResult[] | null>(null);
  const [running, setRunning] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof EVInput, string>>>({});

  const validate = () => {
    const errs: Partial<Record<keyof EVInput, string>> = {};
    if (!input.totalTrades || input.totalTrades < 1 || input.totalTrades > 10000)
      errs.totalTrades = "Min 1, max 10,000";
    if (input.wins < 0 || input.wins > input.totalTrades)
      errs.wins = "Wins cannot exceed total trades";
    if (!input.avgWin || input.avgWin <= 0) errs.avgWin = "Must be > $0";
    if (!input.avgLoss || input.avgLoss <= 0) errs.avgLoss = "Must be > $0";
    return errs;
  };

  const handleRun = useCallback(() => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setRunning(true);
    setTimeout(() => {
      setResults(runSimulation(input, FIRMS));
      setRunning(false);
    }, 0);
  }, [input]);

  const field = (key: keyof EVInput, label: string, max?: number) => (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
      <input
        type="number"
        value={input[key]}
        min={0}
        max={max}
        onChange={(e) => setInput({ ...input, [key]: parseFloat(e.target.value) || 0 })}
        className={`w-full bg-slate-800 border rounded px-3 py-2 text-slate-50 focus:ring-1 focus:ring-blue-500 outline-none transition-colors duration-150 ${
          errors[key] ? "border-red-500" : "border-slate-600 focus:border-blue-500"
        }`}
      />
      {errors[key] && <p className="text-red-400 text-sm mt-1">{errors[key]}</p>}
    </div>
  );

  return (
    <section id="ev-calc" className="scroll-mt-20">
      <h2 className="text-2xl font-bold text-slate-100 mb-6">EV Calculator</h2>
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Inputs */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-100">Your Trading Stats</h3>
            {field("totalTrades", "Total Trades", 10000)}
            {field("wins", "Winning Trades", input.totalTrades)}
            {field("avgWin", "Avg Win ($)")}
            {field("avgLoss", "Avg Loss ($)")}
            <div className="pt-2">
              <p className="text-sm text-slate-400 mb-3">
                Win Rate: <span className="text-slate-200 font-medium">{input.totalTrades > 0 ? ((input.wins / input.totalTrades) * 100).toFixed(1) : 0}%</span>
                {" "}&middot; RR: <span className="text-slate-200 font-medium">{input.avgLoss > 0 ? (input.avgWin / input.avgLoss).toFixed(2) : "—"}</span>
              </p>
              <button
                onClick={handleRun}
                disabled={running}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium px-4 py-2.5 rounded transition-all duration-150 cursor-pointer"
              >
                {running && <Loader2 className="w-4 h-4 animate-spin" />}
                {running ? "Simulating…" : "Run Simulation"}
              </button>
            </div>
          </div>

          {/* Results */}
          <div>
            <h3 className="text-lg font-semibold text-slate-100 mb-3">Results</h3>
            {!results && !running && (
              <p className="text-slate-400 italic text-sm">Enter your stats and click Run Simulation</p>
            )}
            {results && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-700">
                      <th className="text-left pb-2 font-medium">Firm</th>
                      <th className="text-right pb-2 font-medium">Pass%</th>
                      <th className="text-right pb-2 font-medium">EV</th>
                      <th className="text-right pb-2 font-medium">Cost→Funded</th>
                      <th className="text-right pb-2 font-medium">Split%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr
                        key={r.firm}
                        className={`border-b border-slate-800 ${
                          i < 3
                            ? "bg-gradient-to-r from-emerald-950/50 to-transparent border-l-4 border-l-emerald-500"
                            : "hover:bg-slate-700/30"
                        } transition-colors duration-150`}
                      >
                        <td className={`py-2 pl-2 pr-4 font-medium ${ i < 3 ? "text-emerald-300" : "text-slate-200" }`}>{r.firm}</td>
                        <td className={`py-2 text-right ${ i < 3 ? "text-emerald-300 font-semibold" : "text-slate-300" }`}>{r.passRate}%</td>
                        <td className={`py-2 text-right font-semibold ${ r.ev >= 0 ? "text-emerald-400" : "text-red-400" }`}>{fmt(r.ev)}</td>
                        <td className={`py-2 text-right ${ i < 3 ? "text-emerald-300" : "text-slate-300" }`}>{fmt(r.costToFunded)}</td>
                        <td className={`py-2 pr-2 text-right ${ i < 3 ? "text-emerald-300" : "text-slate-300" }`}>{r.split}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-slate-500 mt-3">1,000 Monte Carlo runs per firm. Top 3 by EV highlighted.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
