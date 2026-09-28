import type { Metadata } from "next";
import { Chakra_Petch, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const head = Chakra_Petch({ variable: "--font-head", subsets: ["latin"], weight: ["500", "600", "700"] });
const data = JetBrains_Mono({ variable: "--font-data", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FinAlly — AI Trading Workstation",
  description: "Live market data, simulated portfolio, and an AI trading copilot.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${head.variable} ${data.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
