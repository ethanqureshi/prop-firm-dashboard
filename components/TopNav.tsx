"use client";

export default function TopNav() {
  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      className="sticky top-0 z-40 backdrop-blur"
      style={{
        backgroundColor: "rgba(10, 10, 15, 0.95)",
        borderBottom: "1px solid #1e1e2e",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-lg tracking-tight text-white">
          PropFirm{" "}
          <span style={{ color: "#3b82f6" }}>Dashboard</span>
        </span>
        <div className="flex gap-2">
          {[
            { id: "ev-calc", label: "EV Calculator" },
            { id: "risk-dash", label: "Risk Dashboard" },
          ].map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={scrollTo(id)}
              className="px-4 py-1.5 rounded-full text-sm font-medium text-slate-400 hover:text-white transition-all duration-150 cursor-pointer"
              style={{ backgroundColor: "transparent" }}
              onMouseEnter={(e) =>
                ((e.target as HTMLElement).style.backgroundColor = "#1e1e2e")
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLElement).style.backgroundColor = "transparent")
              }
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
