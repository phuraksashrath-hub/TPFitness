"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "./api";

export type PaymentMode = "simulated" | "disabled" | "unknown";

/** Asks the API whether checkout is a simulation, so shoppers are never misled about being charged. */
export function usePaymentMode(): PaymentMode {
  const [mode, setMode] = useState<PaymentMode>("unknown");

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE_URL}/health`)
      .then((r) => r.json())
      .then((h: { payments?: string }) => {
        if (!cancelled) setMode(h.payments === "simulated" || h.payments === "disabled" ? h.payments : "unknown");
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return mode;
}
