"use client";
import { useState, useCallback } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { FIRMS } from "@/lib/firms";
import { runSimulation, type EVInput, type SimulationResult } from "@/lib/simulation";
import { Loader2 } from "lucide-react";

const DEFAULT_INPUT: EVInput = { totalTrades: 100, wins: 55, avgWin: 200, avgLoss: 150 };

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

const inputCls =
  "w-full rounded-lg px-3 py-2.5 text-white outline-none transition-all duration-150 text-sm";
const inputStyle = {
  backgroundColor: "#1a1a2e",
  border: "1px solid #1e1e2e",
};
const inputFocusStyle = {
  borderColor: "#3b82f6",
  boxShadow: "0 0 0 2px rgba(59,130,246,0.25)",
};

function DarkInput({
  value,
  onChange,
  hasError,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...rest}
      type="number"
      value={value}
      onChange={onChange}
      className={inputCls}
      style={{
        ...inputStyle,
        ...(focused ? inputFocusStyle : {}),
        ...(hasError ? { borderColor: "#ef4444" } : {}),
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
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

  const winRate = input.totalTrades > 0
    ? ((input.wins / input.totalTrades) * 100).toFixed(1)
    : "0.0";
  const rr = input.avgLoss > 0 ? (input.avgWin / input.avgLoss).toFixed(2) : "—";

  const field = (key: keyof EVInput, label: string, max?: number) => (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "#94a3b8" }}>
        {label}
      </label>
      <DarkInput
        value={input[key]}
        min={0}
        max={max}
        onChange={(e) => setInput({ ...input, [key]: parseFloat(e.target.value) || 0 })}
        hasError={!!errors[key]}
      />
      {errors[key] && (
        <p className="text-sm mt-1" style={{ color: "#ef4444" }}>
          {errors[key]}
        </p>
      )}
    </div>
  );

  return (
    <section id="ev-calc" className="scroll-mt-20">
      <div
        className="rounded-2xl p-6 md:p-8"
        style={{ backgroundColor: "#111118", border: "1px solid #1e1e2e" }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* LEFT — Inputs */}
          <div className="space-y-4">
            <div className="mb-2">
              <h2 className="text-xl font-bold text-white">Your Trading Stats</h2>
              <p className="text-sm mt-1" style={{ color: "#64748b" }}>
                Enter your historical stats to run the simulation.
              </p>
            </div>

            {field("totalTrades", "Total Trades", 10000)}
            {field("wins", "Winning Trades", input.totalTrades)}
            {field("avgWin", "Avg Win ($)")}
            {field("avgLoss", "Avg Loss ($)")}

            {/* Stat badges */}
            <div className="flex gap-3 flex-wrap pt-1">
              <span
                className="px-3 py-1 rounded-full text-sm font-semibold"
                style={{ backgroundColor: "#0d2a1f", color: "#10b981", border: "1px solid #10b981" + "33" }}
              >
                Win Rate: {winRate}%
              </span>
              <span
                className="px-3 py-1 rounded-full text-sm font-semibold"
                style={{ backgroundColor: "#0d1a2e", color: "#3b82f6", border: "1px solid #3b82f6" + "33" }}
              >
                R:R {rr}
              </span>
            </div>

            <button
              onClick={handleRun}
              disabled={running}
              className="w-auto flex items-center gap-2 font-semibold px-6 py-3 rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                backgroundColor: running ? "#2563eb" : "#3b82f6",
                color: "#ffffff",
              }}
              onMouseEnter={(e) => {
                if (!running) (e.currentTarget as HTMLElement).style.backgroundColor = "#2563eb";
              }}
              onMouseLeave={(e) => {
                if (!running) (e.currentTarget as HTMLElement).style.backgroundColor = "#3b82f6";
              }}
            >
              {running && <Loader2 className="w-4 h-4 animate-spin" />}
              {running ? "Simulating…" : "Run Simulation"}
            </button>
          </div>

          {/* RIGHT — Results */}
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white">Results</h2>
              <p className="text-sm mt-1" style={{ color: "#64748b" }}>
                Ranked by expected value. Top 3 highlighted.
              </p>
            </div>

            {!results && !running && (
              <div
                className="rounded-xl p-8 text-center"
                style={{ backgroundColor: "#0a0a0f", border: "1px solid #1e1e2e" }}
              >
                <p className="text-sm" style={{ color: "#475569" }}>
                  Enter your stats and click Run Simulation
                </p>
              </div>
            )}

            {results && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1e1e2e" }}>
                      {["Firm", "Pass%", "EV", "Cost→Funded", "Split%"].map((h, i) => (
                        <th
                          key={h}
                          className={`pb-2.5 font-medium text-xs uppercase tracking-wider ${
                            i === 0 ? "text-left" : "text-right"
                          }`}
                          style={{ color: "#475569" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr
                        key={r.firm}
                        className="transition-colors duration-150"
                        style={{
                          borderBottom: "1px solid #1e1e2e",
                          backgroundColor:
                            i < 3
                              ? i % 2 === 0
                                ? "rgba(16,185,129,0.06)"
                                : "rgba(16,185,129,0.03)"
                              : i % 2 === 0
                              ? "transparent"
                              : "rgba(255,255,255,0.015)",
                          borderLeft: i < 3 ? "3px solid #10b981" : "3px solid transparent",
                        }}
                      >
                        <td
                          className="py-2.5 pl-3 pr-4 font-medium"
                          style={{ color: i < 3 ? "#10b981" : "#e2e8f0" }}
                        >
                          {r.firm}
                        </td>
                        <td
                          className="py-2.5 text-right"
                          style={{ color: i < 3 ? "#10b981" : "#94a3b8" }}
                        >
                          {r.passRate}%
                        </td>
                        <td
                          className="py-2.5 text-right font-bold"
                          style={{ color: r.ev >= 0 ? "#10b981" : "#ef4444" }}
                        >
                          {fmt(r.ev)}
                        </td>
                        <td
                          className="py-2.5 text-right"
                          style={{ color: i < 3 ? "#10b981" : "#94a3b8" }}
                        >
                          {fmt(r.costToFunded)}
                        </td>
                        <td
                          className="py-2.5 pr-2 text-right"
                          style={{ color: i < 3 ? "#10b981" : "#94a3b8" }}
                        >
                          {r.split}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs mt-3" style={{ color: "#334155" }}>
                  1,000 Monte Carlo runs per firm. Top 3 by EV highlighted.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
