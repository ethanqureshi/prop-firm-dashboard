"use client";

export default function TopNav() {
  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="sticky top-0 bg-slate-950/95 backdrop-blur border-b border-slate-800 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <span className="text-slate-100 font-bold text-lg tracking-tight">
          PropFirm Dashboard
        </span>
        <div className="flex gap-6">
          <a
            href="#ev-calc"
            onClick={scrollTo("ev-calc")}
            className="text-slate-400 hover:text-blue-400 transition-colors duration-150 text-sm font-medium cursor-pointer"
          >
            EV Calculator
          </a>
          <a
            href="#risk-dash"
            onClick={scrollTo("risk-dash")}
            className="text-slate-400 hover:text-blue-400 transition-colors duration-150 text-sm font-medium cursor-pointer"
          >
            Risk Dashboard
          </a>
        </div>
      </div>
    </nav>
  );
}
