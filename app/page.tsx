import TopNav from "@/components/TopNav";
import EVCalculator from "@/components/EVCalculator";
import RiskDashboard from "@/components/RiskDashboard";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950">
      <TopNav />
      <main className="max-w-7xl mx-auto px-4 py-10 space-y-16">
        <EVCalculator />
        <RiskDashboard />
      </main>
    </div>
  );
}
