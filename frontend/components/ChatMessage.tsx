import { formatPrice, formatQty } from "@/lib/format";
import type { ChatEntry } from "@/lib/types";

function Chip({ tone, children }: { tone: "ok" | "err" | "info"; children: React.ReactNode }) {
  const styles = {
    ok: "border-up/40 bg-up/10 text-up",
    err: "border-down/40 bg-down/10 text-down",
    info: "border-blue/40 bg-blue/10 text-blue",
  };
  return <li className={`border px-2 py-0.5 text-[11px] ${styles[tone]}`}>{children}</li>;
}

export function ChatMessage({ entry }: { entry: ChatEntry }) {
  const isUser = entry.role === "user";
  const hasActions = !!(entry.trades?.length || entry.watchlist_changes?.length || entry.errors?.length);

  return (
    <div data-testid="chat-message" data-role={entry.role} className={`rise flex flex-col ${isUser ? "items-end" : "items-start"}`}>
      <span className="mb-0.5 font-display text-[9px] uppercase tracking-[0.25em] text-muted">
        {isUser ? "You" : "FinAlly"}
      </span>
      <div
        className={`max-w-[92%] whitespace-pre-wrap border px-3 py-2 text-[13px] leading-relaxed ${
          isUser ? "border-purple/50 bg-purple/15" : "border-line bg-raised"
        }`}
      >
        {entry.content}
      </div>
      {hasActions && (
        <ul data-testid="chat-actions" className="mt-1.5 flex max-w-[92%] flex-wrap gap-1">
          {entry.trades?.map((t, i) => (
            <Chip key={`t${i}`} tone={t.status === "executed" ? "ok" : "err"}>
              {t.side.toUpperCase()} {formatQty(t.quantity)} {t.ticker}
              {t.price != null && ` @ ${formatPrice(t.price)}`}
              {t.error && ` · ${t.error}`}
            </Chip>
          ))}
          {entry.watchlist_changes?.map((w, i) => (
            <Chip key={`w${i}`} tone={w.status === "executed" ? "info" : "err"}>
              {w.action === "add" ? "+" : "−"} {w.ticker} watchlist
            </Chip>
          ))}
          {entry.errors?.map((e, i) => (
            <Chip key={`e${i}`} tone="err">
              {e}
            </Chip>
          ))}
        </ul>
      )}
    </div>
  );
}
