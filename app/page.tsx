import TopNav from "@/components/TopNav";
import EVCalculator from "@/components/EVCalculator";
import RiskDashboard from "@/components/RiskDashboard";

export default function Home() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#080810" }}>
      <TopNav />

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="dot-pattern absolute inset-0" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 60%, rgba(79,142,247,0.07) 0%, transparent 70%)",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 pt-16 pb-6 text-center">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3 fade-in fade-delay-1">
            <span className="gradient-text">Find Your Best Prop Firm</span>
          </h1>
          <p
            className="text-lg max-w-2xl mx-auto fade-in fade-delay-2"
            style={{ color: "#6b7280" }}
          >
            Monte Carlo simulations across 14 firms — see real expected value before you buy an eval.
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 sm:px-8 py-12 space-y-16">
        <EVCalculator />
        <RiskDashboard />
      </main>
    </div>
  );
}
