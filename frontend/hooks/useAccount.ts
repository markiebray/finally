"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Portfolio, Snapshot, WatchlistItem } from "@/lib/types";

const HISTORY_POLL_MS = 30_000;

const fetchAccount = () => Promise.all([api.portfolio(), api.history(), api.watchlist()]);

/** Server-side account state: portfolio, value history, and watchlist. */
export function useAccount() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

  const apply = useCallback(([p, h, w]: Awaited<ReturnType<typeof fetchAccount>>) => {
    setPortfolio(p);
    setHistory(h);
    setWatchlist(w);
  }, []);

  const refresh = useCallback(() => fetchAccount().then(apply), [apply]);

  useEffect(() => {
    fetchAccount().then(apply);
    const id = setInterval(() => api.history().then(setHistory), HISTORY_POLL_MS);
    return () => clearInterval(id);
  }, [apply]);

  return { portfolio, history, watchlist, refresh };
}
