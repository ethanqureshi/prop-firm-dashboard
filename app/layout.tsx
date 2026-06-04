import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PropFirm Dashboard",
  description: "Prop firm EV calculator and intraday risk management dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${spaceGrotesk.variable} ${spaceMono.variable}`}>
      <body
        className="antialiased"
        style={{
          fontFamily: "var(--font-sans, -apple-system, BlinkMacSystemFont, sans-serif)",
          backgroundColor: "#080810",
          color: "#f1f5f9",
        }}
      >
        {children}
      </body>
    </html>
  );
}
