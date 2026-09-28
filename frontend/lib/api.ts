import type { ChatHistoryItem, ChatResponse,Portfolio, Side, Snapshot, WatchlistItem } from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json" },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.detail ?? `Request failed (${res.status})`);
  return body as T;
}

const post = (body: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(body) });

export const api = {
  portfolio: () => request<Portfolio>("/api/portfolio"),
  history: () => request<Snapshot[]>("/api/portfolio/history"),
  trade: (ticker: string, quantity: number, side: Side) =>
    request<{ portfolio: Portfolio }>("/api/portfolio/trade", post({ ticker, quantity, side })),
  watchlist: () => request<WatchlistItem[]>("/api/watchlist"),
  addTicker: (ticker: string) => request("/api/watchlist", post({ ticker })),
  removeTicker: (ticker: string) =>
    request(`/api/watchlist/${encodeURIComponent(ticker)}`, { method: "DELETE" }),
  chatHistory: () => request<ChatHistoryItem[]>("/api/chat"),
  chat: (message: string) => request<ChatResponse>("/api/chat", post({ message })),
};
