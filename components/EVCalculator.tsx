"use client";
import { useState, useCallback } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { FIRMS } from "@/lib/firms";
import { runSimulation, type EVInput, type SimulationResult } from "@/lib/simulation";
import { Loader2, Trophy } from "lucide-react";

const DEFAULT_INPUT: EVInput = { totalTrades: 100, wins: 55, avgWin: 200, avgLoss: 150 };

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  }).format(n);
}

const INPUT_BASE: React.CSSProperties = {
  width: "100%",
  backgroundColor: "#0c0c18",
  border: "1px solid #1a1a2e",
  borderRadius: "8px",
  padding: "9px 12px",
  color: "#f1f5f9",
  fontSize: "14px",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

function DarkInput({
  hasError,
  tooltip,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean; tooltip?: string }) {
  const [focused, setFocused] = useState(false);
  const input = (
    <input
      {...rest}
      type="number"
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

const MEDAL_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];

export default function EVCalculator() {
  const [input, setInput] = useLocalStorage<EVInput>("ev.calculator.input", DEFAULT_INPUT);
  const [results, setResults] = useState<SimulationResult[] | null>(null);
  const [running, setRunning] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof EVInput, string>>>({});
  const sectionRef = useScrollReveal<HTMLElement>();

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
    ? ((input.wins / input.totalTrades) * 100).toFixed(1) : "0.0";
  const rr = input.avgLoss > 0 ? (input.avgWin / input.avgLoss).toFixed(2) : "—";

  const field = (
    key: keyof EVInput,
    label: string,
    tooltip: string,
    max?: number,
  ) => (
    <div>
      <label
        className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
        style={{ color: "#6b7280" }}
      >
        {label}
      </label>
      <DarkInput
        value={input[key]}
        min={0}
        max={max}
        onChange={(e) => setInput({ ...input, [key]: parseFloat(e.target.value) || 0 })}
        hasError={!!errors[key]}
        tooltip={tooltip}
      />
      {errors[key] && (
        <p className="text-xs mt-1" style={{ color: "#ff4757" }}>{errors[key]}</p>
      )}
    </div>
  );

  return (
    <section ref={sectionRef} id="ev-calc" className="scroll-mt-24">
      <div
        className="rounded-2xl overflow-hidden card-glow"
        style={{ backgroundColor: "#0f0f1a", border: "1px solid #1a1a2e" }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2">

          {/* LEFT — Inputs */}
          <div
            className="p-6 md:p-8"
            style={{
              borderRight: "1px solid #1a1a2e",
              borderLeft: "3px solid rgba(79,142,247,0.35)",
            }}
          >
            <div className="mb-5">
              <h2 className="text-lg font-bold text-white">Your Trading Stats</h2>
              <p className="text-xs mt-1" style={{ color: "#6b7280" }}>
                Based on your last 50+ trades
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-5 mb-6">
              {field("totalTrades", "Total Trades", "Total trades in your sample", 10000)}
              {field("wins", "Winning Trades", "Number of profitable trades", input.totalTrades)}
              {field("avgWin", "Avg Win ($)", "Average profit per winning trade")}
              {field("avgLoss", "Avg Loss ($)", "Average loss per losing trade")}
            </div>

            {/* Stat pills */}
            <div className="flex gap-3 flex-wrap mb-6">
              <span
                className="mono px-3 py-1.5 rounded-full text-sm font-bold"
                style={{
                  backgroundColor: "#001a10",
                  color: "#00d68f",
                  border: "1px solid rgba(0,214,143,0.22)",
                  boxShadow: "0 0 12px rgba(0,214,143,0.1)",
                }}
              >
                Win Rate {winRate}%
              </span>
              <span
                className="mono px-3 py-1.5 rounded-full text-sm font-bold"
                style={{
                  backgroundColor: "#080e1e",
                  color: "#4f8ef7",
                  border: "1px solid rgba(79,142,247,0.22)",
                  boxShadow: "0 0 12px rgba(79,142,247,0.1)",
                }}
              >
                R:R {rr}
              </span>
            </div>

            <button
              onClick={handleRun}
              disabled={running}
              className="btn-primary flex items-center gap-2 font-bold px-6 py-3 rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#4f8ef7", color: "#ffffff" }}
            >
              {running && <Loader2 className="w-4 h-4 animate-spin" />}
              {running ? "Simulating…" : "Run Simulation"}
            </button>
          </div>

          {/* RIGHT — Results */}
          <div className="p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-white">Results</h2>
              <p className="text-xs mt-1" style={{ color: "#6b7280" }}>
                Ranked by expected value · 1,000 Monte Carlo runs each
              </p>
            </div>

            {!results && !running && (
              <div
                className="rounded-xl p-10 text-center"
                style={{ backgroundColor: "#080810", border: "1px solid #1a1a2e" }}
              >
                <p className="text-sm" style={{ color: "#334155" }}>
                  Enter your stats and click Run Simulation
                </p>
              </div>
            )}

            {results && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1a1a2e" }}>
                      {["", "Firm", "Pass%", "EV", "Cost→Funded", "Split"].map((h, i) => (
                        <th
                          key={i}
                          className={`pb-3 font-semibold uppercase tracking-wider ${
                            i <= 1 ? "text-left" : "text-right"
                          }`}
                          style={{ color: "#334155", fontSize: "10px", letterSpacing: "0.08em" }}
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
                        className="transition-colors duration-100 cursor-default"
                        style={{
                          borderBottom: "1px solid #1a1a2e",
                          borderLeft:
                            i < 3
                              ? `3px solid ${MEDAL_COLORS[i]}60`
                              : "3px solid transparent",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "#1a1a2e")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = "transparent")
                        }
                      >
                        {/* Rank */}
                        <td className="py-3 pl-3 pr-2" style={{ width: 52, minWidth: 52 }}>
                          {i < 3 ? (
                            <span
                              className="mono font-black flex items-center gap-0.5"
                              style={{ color: MEDAL_COLORS[i], fontSize: "11px" }}
                            >
                              {i === 0 && <Trophy className="w-3 h-3" />}
                              #{i + 1}
                            </span>
                          ) : (
                            <span className="mono" style={{ color: "#334155", fontSize: "11px" }}>
                              #{i + 1}
                            </span>
                          )}
                        </td>

                        {/* Firm + badge */}
                        <td className="py-3 pr-4" style={{ minWidth: 130 }}>
                          <div className="flex flex-col gap-0.5">
                            <span
                              className="font-semibold"
                              style={{ color: i < 3 ? "#00d68f" : "#e2e8f0" }}
                            >
                              {r.firm}
                            </span>
                            {i === 0 && (
                              <span
                                className="text-xs px-1.5 py-0.5 rounded font-bold self-start"
                                style={{
                                  backgroundColor: "rgba(0,214,143,0.1)",
                                  color: "#00d68f",
                                  border: "1px solid rgba(0,214,143,0.22)",
                                }}
                              >
                                Best for you
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Pass% */}
                        <td
                          className="py-3 text-right mono"
                          style={{ color: i < 3 ? "#00d68f" : "#6b7280" }}
                        >
                          {r.passRate}%
                        </td>

                        {/* EV */}
                        <td
                          className="py-3 text-right font-black mono"
                          style={{ color: r.ev >= 0 ? "#00d68f" : "#ff4757" }}
                        >
                          {fmt(r.ev)}
                        </td>

                        {/* Cost→Funded */}
                        <td
                          className="py-3 text-right mono"
                          style={{ color: i < 3 ? "#00d68f" : "#6b7280" }}
                        >
                          {fmt(r.costToFunded)}
                        </td>

                        {/* Split */}
                        <td
                          className="py-3 pr-3 text-right mono"
                          style={{ color: i < 3 ? "#00d68f" : "#6b7280" }}
                        >
                          {r.split}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
