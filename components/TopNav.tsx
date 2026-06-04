"use client";
import { useState } from "react";
import { HelpCircle, X } from "lucide-react";

const EV_STEPS = [
  "Pull your last 50+ trades from any platform.",
  "Enter total trades, wins, average win $, and average loss $.",
  "Click Run Simulation.",
  "The table shows which prop firm gives you the highest expected profit based on YOUR stats.",
  "Lower cost-to-funded = cheaper to get a funded account on average.",
];

const RISK_STEPS = [
  "Click ‘Load Apex Intraday’ or enter your firm’s rules manually.",
  "Save Rules.",
  "Before trading: enter your pre-open price and direction.",
  "After each trade: log entry price, units, direction, exit price.",
  "The dashboard tracks your daily P&L vs your firm’s limit in real time.",
  "Stop trading when the bar hits red or the banner appears.",
  "The position sizer tells you max contracts per trade given your remaining daily buffer.",
];

export default function TopNav() {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"ev" | "risk">("ev");

  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <nav
        className="sticky top-0 z-40 backdrop-blur"
        style={{
          backgroundColor: "rgba(8,8,16,0.95)",
          borderBottom: "1px solid #1a1a2e",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-bold text-lg tracking-tight text-white">
            PropFirm{" "}
            <span style={{ color: "#4f8ef7" }}>Dashboard</span>
          </span>

          <div className="flex items-center gap-2">
            {[
              { id: "ev-calc", label: "EV Calculator" },
              { id: "risk-dash", label: "Risk Dashboard" },
            ].map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={scrollTo(id)}
                className="px-4 py-1.5 rounded-full text-sm font-medium text-slate-400 hover:text-white transition-all duration-150 cursor-pointer"
                style={{ border: "1px solid transparent" }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.backgroundColor = "#1a1a2e";
                  el.style.borderColor = "#2a2a3e";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.backgroundColor = "transparent";
                  el.style.borderColor = "transparent";
                }}
              >
                {label}
              </a>
            ))}

            <div style={{ width: 1, height: 16, backgroundColor: "#1a1a2e", margin: "0 4px" }} />

            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 cursor-pointer"
              style={{
                backgroundColor: "#0d1628",
                color: "#4f8ef7",
                border: "1px solid rgba(79,142,247,0.25)",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor = "#4f8ef715")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor = "#0d1628")
              }
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>How to use</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Onboarding Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden"
            style={{
              backgroundColor: "#0f0f1a",
              border: "1px solid #1a1a2e",
              boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid #1a1a2e" }}
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4" style={{ color: "#4f8ef7" }} />
                <h2 className="font-bold text-white">How to use this</h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="cursor-pointer transition-colors duration-150"
                style={{ color: "#6b7280" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "#f1f5f9")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "#6b7280")
                }
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 px-6 pt-5">
              {(["ev", "risk"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer"
                  style={{
                    backgroundColor: activeTab === tab ? "#4f8ef7" : "#1a1a2e",
                    color: activeTab === tab ? "#ffffff" : "#6b7280",
                  }}
                >
                  {tab === "ev" ? "EV Calculator" : "Risk Dashboard"}
                </button>
              ))}
            </div>

            {/* Steps */}
            <div className="px-6 py-5 pb-7">
              <ol className="space-y-3">
                {(activeTab === "ev" ? EV_STEPS : RISK_STEPS).map((step, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                      style={{ backgroundColor: "#1a1a2e", color: "#4f8ef7" }}
                    >
                      {i + 1}
                    </span>
                    <span
                      className="text-sm leading-relaxed"
                      style={{ color: "#94a3b8" }}
                      dangerouslySetInnerHTML={{ __html: step }}
                    />
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
