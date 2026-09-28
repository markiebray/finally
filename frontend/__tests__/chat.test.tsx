import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChatPanel } from "@/components/ChatPanel";
import type { ChatHistoryItem, ChatResponse } from "@/lib/types";

const noHistory = () => Promise.resolve([]);

const response: ChatResponse = {
  message: "Bought 5 AAPL.",
  trades: [{ ticker: "AAPL", side: "buy", quantity: 5, price: 190.1, status: "executed" }],
  watchlist_changes: [{ ticker: "PYPL", action: "add", status: "executed" }],
  errors: ["Sell TSLA 100: Insufficient shares"],
};

const history: ChatHistoryItem[] = [
  { role: "user", content: "buy 5 AAPL", actions: null, created_at: "2026-09-28T01:00:00Z" },
  { role: "assistant", content: "Bought 5 AAPL.", actions: response, created_at: "2026-09-28T01:00:01Z" },
];

describe("ChatPanel", () => {
  it("shows loading, then the reply with inline actions", async () => {
    let resolve!: (r: ChatResponse) => void;
    const send = vi.fn(() => new Promise<ChatResponse>((r) => (resolve = r)));
    const onActions = vi.fn();
    render(<ChatPanel send={send} loadHistory={noHistory} onActions={onActions} />);

    await userEvent.type(screen.getByTestId("chat-input"), "buy 5 AAPL{enter}");
    expect(send).toHaveBeenCalledWith("buy 5 AAPL");
    expect(screen.getByTestId("chat-loading")).toBeInTheDocument();

    resolve(response);
    expect(await screen.findByText("Bought 5 AAPL.")).toBeInTheDocument();
    expect(screen.queryByTestId("chat-loading")).not.toBeInTheDocument();
    expect(screen.getByText(/BUY 5 AAPL @ 190.10/)).toBeInTheDocument();
    expect(screen.getByText(/PYPL watchlist/)).toBeInTheDocument();
    expect(screen.getByText(/Insufficient shares/)).toBeInTheDocument();
    expect(onActions).toHaveBeenCalled();
    expect(screen.getAllByTestId("chat-message")).toHaveLength(3);
  });

  it("keeps the welcome message when history is empty", async () => {
    const loadHistory = vi.fn(noHistory);
    render(<ChatPanel send={vi.fn()} loadHistory={loadHistory} onActions={vi.fn()} />);
    await vi.waitFor(() => expect(loadHistory).toHaveBeenCalled());
    expect(screen.getAllByTestId("chat-message")).toHaveLength(1);
    expect(screen.getByText(/FinAlly online/)).toBeInTheDocument();
  });

  it("replaces the welcome with saved history, including inline actions", async () => {
    render(<ChatPanel send={vi.fn()} loadHistory={() => Promise.resolve(history)} onActions={vi.fn()} />);
    expect(await screen.findByText("Bought 5 AAPL.")).toBeInTheDocument();
    const messages = screen.getAllByTestId("chat-message");
    expect(messages.map((m) => m.dataset.role)).toEqual(["user", "assistant"]);
    expect(screen.queryByText(/FinAlly online/)).not.toBeInTheDocument();
    expect(screen.getByText(/BUY 5 AAPL @ 190.10/)).toBeInTheDocument();
    expect(screen.getByText(/PYPL watchlist/)).toBeInTheDocument();
  });

  it("renders a failed trade with null price and its error", async () => {
    const failed: ChatHistoryItem = {
      role: "assistant",
      content: "Could not sell.",
      actions: {
        trades: [{ ticker: "NFLX", side: "sell", quantity: 100000, price: null, status: "failed", error: "Insufficient shares" }],
        watchlist_changes: [],
        errors: [],
      },
      created_at: "2026-09-28T01:00:00Z",
    };
    render(<ChatPanel send={vi.fn()} loadHistory={() => Promise.resolve([failed])} onActions={vi.fn()} />);
    expect(await screen.findByText("Could not sell.")).toBeInTheDocument();
    expect(screen.getByText(/SELL 100000 NFLX/)).toHaveTextContent("SELL 100000 NFLX · Insufficient shares");
  });

  it("collapses and reopens", async () => {
    render(<ChatPanel send={vi.fn()} loadHistory={noHistory} onActions={vi.fn()} />);
    await userEvent.click(screen.getByTestId("chat-toggle"));
    expect(screen.queryByTestId("chat-input")).not.toBeInTheDocument();
    await userEvent.click(screen.getByTestId("chat-toggle"));
    expect(screen.getByTestId("chat-input")).toBeInTheDocument();
  });
});
