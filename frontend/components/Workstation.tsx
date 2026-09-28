"use client";

import { useState } from "react";
import { useAccount } from "@/hooks/useAccount";
import { usePriceStream } from "@/hooks/usePriceStream";
import { api } from "@/lib/api";
import { livePortfolio } from "@/lib/portfolio";
import type { Side } from "@/lib/types";
import { ChatPanel } from "./ChatPanel";
import { Header } from "./Header";
import { Heatmap } from "./Heatmap";
import { MainChart } from "./MainChart";
import { PnlChart } from "./PnlChart";
import { PositionsTable } from "./PositionsTable";
import { TradeBar } from "./TradeBar";
import { Watchlist } from "./Watchlist";

export function Workstation() {
  const stream = usePriceStream();
  const account = useAccount();
  const [picked, setPicked] = useState<string | null>(null);
  const [tradeTicker, setTradeTicker] = useState<string | null>(null);

  const portfolio = account.portfolio && livePortfolio(account.portfolio, stream.prices);
  const selected = picked ?? account.watchlist[0]?.ticker ?? null;

  function select(ticker: string) {
    setPicked(ticker);
    setTradeTicker(ticker);
  }

  async function trade(ticker: string, quantity: number, side: Side) {
    await api.trade(ticker, quantity, side);
    await account.refresh();
  }

  async function addTicker(ticker: string) {
    await api.addTicker(ticker);
    await account.refresh();
  }

  async function removeTicker(ticker: string) {
    await api.removeTicker(ticker);
    if (picked === ticker) setPicked(null);
    await account.refresh();
  }

  return (
    <div className="flex h-screen flex-col">
      <Header
        totalValue={portfolio?.total_value ?? null}
        cash={portfolio?.cash ?? null}
        pnl={portfolio?.unrealized_pnl ?? null}
        status={stream.status}
      />
      <main className="flex min-h-0 flex-1 gap-2 p-2">
        <div className="w-[250px] shrink-0 xl:w-[300px]">
          <Watchlist
            items={account.watchlist}
            prices={stream.prices}
            history={stream.history}
            sessionOpen={stream.sessionOpen}
            selected={selected}
            onSelect={select}
            onAdd={addTicker}
            onRemove={removeTicker}
          />
        </div>
        <div className="grid min-h-0 min-w-0 flex-1 grid-rows-[minmax(0,5fr)_auto_minmax(0,4fr)_minmax(0,3fr)] gap-2">
          <MainChart
            ticker={selected}
            points={selected ? (stream.history[selected] ?? []) : []}
            update={selected ? stream.prices[selected] : undefined}
            sessionOpen={selected ? stream.sessionOpen[selected] : undefined}
          />
          <TradeBar ticker={tradeTicker ?? selected ?? ""}onTickerChange={setTradeTicker} onTrade={trade} />
          <div className="grid min-h-0 grid-cols-2 gap-2">
            <Heatmap positions={portfolio?.positions ?? []} onSelect={select} />
            <PnlChart history={account.history} />
          </div>
          <PositionsTable positions={portfolio?.positions ?? []} onSelect={select} />
        </div>
        <ChatPanel send={api.chat} loadHistory={api.chatHistory}onActions={account.refresh} />
      </main>
    </div>
  );
}
