"use client";
import { useState } from "react";
import { HelpCircle, X, Menu } from "lucide-react";

const NAV_LINKS = [
  { id: "ev-calc", label: "EV Calculator" },
  { id: "risk-dash", label: "Risk Dashboard" },
];

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"ev" | "risk">("ev");

  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  return (
    <>
      <nav
        className="sticky top-0 z-40 backdrop-blur"
        style={{
          backgroundColor: "rgba(8,8,16,0.97)",
          borderBottom: "1px solid #1a1a2e",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <span className="font-bold text-lg tracking-tight text-white flex-shrink-0">
            PropFirm <span style={{ color: "#4f8ef7" }}>Dashboard</span>
          </span>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={scrollTo(id)}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 cursor-pointer"
                style={{ color: "#94a3b8", border: "1px solid transparent" }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.color = "#ffffff";
                  el.style.backgroundColor = "#1a1a2e";
                  el.style.borderColor = "#2a2a3e";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.color = "#94a3b8";
                  el.style.backgroundColor = "transparent";
                  el.style.borderColor = "transparent";
                }}
              >
                {label}
              </a>
            ))}

            <div style={{ width: 1, height: 20, backgroundColor: "#1a1a2e", flexShrink: 0 }} />

            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-150 cursor-pointer"
              style={{
                backgroundColor: "#0d1628",
                color: "#4f8ef7",
                border: "1px solid rgba(79,142,247,0.3)",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor = "rgba(79,142,247,0.1)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor = "#0d1628")
              }
            >
              <HelpCircle className="w-3.5 h-3.5" />
              How to use
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg cursor-pointer transition-colors duration-150"
            style={{ color: "#94a3b8" }}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.backgroundColor = "#1a1a2e")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")
            }
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div
            className="md:hidden"
            style={{ borderTop: "1px solid #1a1a2e", backgroundColor: "rgba(8,8,16,0.98)" }}
          >
            <div className="px-6 py-3 flex flex-col">
              {NAV_LINKS.map(({ id, label }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  onClick={scrollTo(id)}
                  className="text-sm font-medium py-3 px-3 rounded-lg transition-colors duration-150 cursor-pointer"
                  style={{ color: "#94a3b8" }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.color = "#ffffff";
                    el.style.backgroundColor = "#1a1a2e";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.color = "#94a3b8";
                    el.style.backgroundColor = "transparent";
                  }}
                >
                  {label}
                </a>
              ))}
              <button
                onClick={() => { setMobileOpen(false); setModalOpen(true); }}
                className="flex items-center gap-2 text-sm font-semibold py-3 px-3 rounded-lg transition-colors duration-150 cursor-pointer text-left mb-1"
                style={{ color: "#4f8ef7" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor = "#1a1a2e")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")
                }
              >
                <HelpCircle className="w-4 h-4" />
                How to use this
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          style={{ backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div
            className="w-full max-w-lg rounded-2xl flex flex-col"
            style={{
              backgroundColor: "#0f0f1a",
              border: "1px solid #1a1a2e",
              boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
              maxHeight: "90vh",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-5 flex-shrink-0"
              style={{ borderBottom: "1px solid #1a1a2e" }}
            >
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#4f8ef7" }} />
                <h2 className="font-bold text-white text-base">How to use this</h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg cursor-pointer transition-all duration-150 flex-shrink-0 ml-4"
                style={{ color: "#6b7280" }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.color = "#f1f5f9";
                  el.style.backgroundColor = "#1a1a2e";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.color = "#6b7280";
                  el.style.backgroundColor = "transparent";
                }}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 px-6 pt-5 pb-1 flex-shrink-0">
              {(["ev", "risk"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer"
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
            <div className="px-6 py-6 overflow-y-auto flex-1">
              <ol className="space-y-5">
                {(activeTab === "ev" ? EV_STEPS : RISK_STEPS).map((step, i) => (
                  <li key={i} className="flex gap-4 items-start">
                    <span
                      className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: "#1a1a2e", color: "#4f8ef7", marginTop: "2px" }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
                      {step}
                    </span>
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
