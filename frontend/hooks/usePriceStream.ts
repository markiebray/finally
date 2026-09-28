"use client";

import { useEffect, useState } from "react";
import { applyUpdates, emptyPriceState, type PriceState } from "@/lib/priceStore";
import type { ConnectionStatus } from "@/lib/types";

/** Subscribe to the SSE price stream, accumulating prices and history since page load. */
export function usePriceStream(url = "/api/stream/prices") {
  const [state, setState] = useState<PriceState>(emptyPriceState);
  const [status, setStatus] = useState<ConnectionStatus>("reconnecting");

  useEffect(() => {
    const source = new EventSource(url);
    source.onopen = () => setStatus("connected");
    source.onmessage = (event) => {
      setState((prev) => applyUpdates(prev, JSON.parse(event.data)));
      setStatus("connected");
    };
    source.onerror = () =>
      setStatus(source.readyState === EventSource.CLOSED ? "disconnected" : "reconnecting");
    return () => source.close();
  }, [url]);

  return { ...state, status };
}
