"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ChatEntry, ChatHistoryItem, ChatResponse } from "@/lib/types";
import { ChatMessage } from "./ChatMessage";

interface ChatPanelProps {
  send: (message: string) => Promise<ChatResponse>;
  loadHistory: () => Promise<ChatHistoryItem[]>;
  onActions: () => void;
}

const WELCOME: ChatEntry = {
  role: "assistant",
  content: "FinAlly online. Ask me to analyze your portfolio, place trades, or manage your watchlist.",
};

const toEntry = ({ role, content, actions }: ChatHistoryItem): ChatEntry => ({ role, content, ...actions });

export function ChatPanel({ send, loadHistory, onActions }: ChatPanelProps) {
  const [open, setOpen] = useState(true);
  const [entries, setEntries] = useState<ChatEntry[]>([WELCOME]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHistory().then((items) => {
      if (items.length) setEntries(items.map(toEntry));
    });
  }, [loadHistory]);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [entries, loading]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const message = draft.trim();
    if (!message || loading) return;
    setDraft("");
    setEntries((prev) => [...prev, { role: "user", content: message }]);
    setLoading(true);
    try {
      const res = await send(message);
      setEntries((prev) => [
        ...prev,
        { role: "assistant", content: res.message, trades: res.trades, watchlist_changes: res.watchlist_changes, errors: res.errors },
      ]);
      if (res.trades?.length || res.watchlist_changes?.length) onActions();
    } catch (err) {
      setEntries((prev) => [...prev, { role: "assistant", content: "Request failed.", errors: [(err as Error).message] }]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        data-testid="chat-toggle"
        onClick={() => setOpen(true)}
        className="flex w-9 shrink-0 flex-col items-center gap-3 border border-line bg-panel/90 py-3 text-accent hover:bg-raised"
        aria-label="Open AI chat"
      >
        <span>«</span>
        <span className="font-display text-[11px] font-semibold tracking-[0.3em] [writing-mode:vertical-rl]">AI COPILOT</span>
      </button>
    );
  }

  return (
    <aside data-testid="chat-panel" className="flex w-[300px] shrink-0 flex-col xl:w-[360px] border border-line bg-panel/90">
      <header className="flex h-7 shrink-0 items-center justify-between border-b border-line bg-raised/60 px-3">
        <h2 className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
          <span className="mr-1.5 text-accent/50">▍</span>AI Copilot
        </h2>
        <button data-testid="chat-toggle" onClick={() => setOpen(false)} className="text-muted hover:text-accent" aria-label="Collapse AI chat">
          »
        </button>
      </header>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {entries.map((entry, i) => (
          <ChatMessage key={i} entry={entry} />
        ))}
        {loading && (
          <div data-testid="chat-loading" className="flex items-center gap-2 text-xs text-muted">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-accent" />
            FinAlly is thinking…
          </div>
        )}
        <div ref={endRef} />
      </div>
      <form onSubmit={submit} className="flex shrink-0 gap-1.5 border-t border-line p-2">
        <input
          data-testid="chat-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask FinAlly…"
          className="min-w-0 flex-1 border border-line bg-bg px-2 py-1.5 text-sm outline-none placeholder:text-muted/60 focus:border-purple"
        />
        <button
          data-testid="chat-send"
          type="submit"
          disabled={loading}
          className="bg-purple px-4 font-display text-xs font-bold tracking-[0.2em] text-white hover:brightness-125 disabled:opacity-40"
        >
          SEND
        </button>
      </form>
    </aside>
  );
}
