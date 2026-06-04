import TopNav from "@/components/TopNav";
import EVCalculator from "@/components/EVCalculator";
import RiskDashboard from "@/components/RiskDashboard";

export default function Home() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0a0a0f" }}>
      <TopNav />
      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 pt-14 pb-2 text-center">
        <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
          Find Your Best{" "}
          <span style={{ color: "#3b82f6" }}>Prop Firm</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Monte Carlo simulations across 14 firms — see real expected value before you buy an eval.
        </p>
      </div>
      <main className="max-w-7xl mx-auto px-4 py-10 space-y-16">
        <EVCalculator />
        <RiskDashboard />
      </main>
    </div>
  );
}
