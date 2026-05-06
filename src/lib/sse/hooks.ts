"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { sseClient, type SSEEventType } from "./client";
import { useAuthStore } from "@/stores/auth.store";

// ── Start / stop SSE based on auth state ─────────────────────────────────────

export function useSSEConnection(): void {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user) {
      sseClient.start();
    } else {
      sseClient.disconnect();
    }
    return () => {
      /* keep alive across renders */
    };
  }, [user?.id]);
}

// ── Subscribe to a specific event ─────────────────────────────────────────────

export function useSSEEvent(
  event: SSEEventType | "*",
  handler: (data: unknown) => void,
): void {
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => {
    const unsub = sseClient.on(event, (data) => ref.current(data));
    return unsub;
  }, [event]);
}

// ── Global toast notifications for all SSE events ────────────────────────────

export function useSSEToasts(): void {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;

    const unsubs = [
      sseClient.on("appointment.created", (d: any) =>
        toast.info(`New booking — ${d?.payload?.clientName}`, {
          description: `${d?.payload?.serviceName} at ${d?.payload?.startTime}`,
        }),
      ),
      sseClient.on("appointment.confirmed", (d: any) =>
        toast.success(`Confirmed — ${d?.payload?.clientName}`, {
          description: `${d?.payload?.serviceName}`,
        }),
      ),
      sseClient.on("appointment.cancelled", (d: any) =>
        toast.warning(`Cancelled — ${d?.payload?.clientName}`, {
          description: d?.payload?.message,
        }),
      ),
      sseClient.on("appointment.checked_in", (d: any) =>
        toast.success(`Arrived — ${d?.payload?.clientName}`, {
          description: `Checked in for ${d?.payload?.serviceName}`,
        }),
      ),
      sseClient.on("appointment.completed", (d: any) =>
        toast.success(`Session complete — ${d?.payload?.clientName}`),
      ),
      sseClient.on("appointment.no_show", (d: any) =>
        toast.warning(`No-show — ${d?.payload?.clientName}`, {
          description: d?.payload?.message,
        }),
      ),
      sseClient.on("invoice.issued", (d: any) =>
        toast.info(`Invoice issued — ${d?.payload?.clientName}`, {
          description: `${d?.payload?.currency} ${d?.payload?.amount?.toFixed(2)}`,
        }),
      ),
      sseClient.on("invoice.paid", (d: any) =>
        toast.success(`Payment received — ${d?.payload?.clientName}`, {
          description: `${d?.payload?.currency} ${d?.payload?.amount?.toFixed(2)}`,
        }),
      ),
    ];

    return () => unsubs.forEach((fn) => fn());
  }, [user?.id]);
}
