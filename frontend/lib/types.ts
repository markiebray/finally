export type Direction = "up" | "down" | "flat";

export interface PriceUpdate {
  ticker: string;
  price: number;
  previous_price: number;
  timestamp: number;
  change: number;
  change_percent: number;
  direction: Direction;
}

export interface PricePoint {
  time: number;
  value: number;
}

export interface Position {
  ticker: string;
  quantity: number;
  avg_cost: number;
  current_price: number;
  market_value: number;
  unrealized_pnl: number;
  pnl_percent: number;
}

export interface Portfolio {
  cash: number;
  total_value: number;
  positions_value: number;
  unrealized_pnl: number;
  positions: Position[];
}

export interface Snapshot {
  total_value: number;
  recorded_at: string;
}

export interface WatchlistItem {
  ticker: string;
  price: number | null;
  previous_price: number | null;
  change_percent: number | null;
  direction: Direction | null;
}

export type Side = "buy" | "sell";

export interface ChatTrade {
  ticker: string;
  side: Side;
  quantity: number;
  price?: number | null;
  status: string;
  error?: string;
}

export interface ChatWatchlistChange {
  ticker: string;
  action: "add" | "remove";
  status: string;
}

export interface ChatResponse {
  message: string;
  trades: ChatTrade[];
  watchlist_changes: ChatWatchlistChange[];
  errors: string[];
}

export interface ChatEntry {
  role: "user" | "assistant";
  content: string;
  trades?: ChatTrade[];
  watchlist_changes?: ChatWatchlistChange[];
  errors?: string[];
}

export interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
  actions: Pick<ChatResponse, "trades" | "watchlist_changes" | "errors"> | null;
  created_at: string;
}

export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";
