import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PropFirm Dashboard",
  description: "Prop firm EV calculator and intraday risk management dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        className="antialiased"
        style={{
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          backgroundColor: "#0a0a0f",
          color: "#f8fafc",
        }}
      >
        {children}
      </body>
    </html>
  );
}
