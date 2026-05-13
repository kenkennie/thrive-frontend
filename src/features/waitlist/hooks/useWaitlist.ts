"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import waitlistApi from "@/lib/api/waitlist";
import { extractArray, extractItem } from "@/lib/api/response";

const KEYS = {
  all: ["waitlist"] as const,
  list: (q: any) => ["waitlist", "list", q] as const,
  stats: ["waitlist", "stats"] as const,
};

export function useWaitlist(q?: any) {
  return useQuery({
    queryKey: KEYS.list(q),
    queryFn: () => waitlistApi.list(q),
    select: (res) => ({
      data: extractArray(res),
      meta: (res as any)?.data?.meta ?? null,
    }),
    placeholderData: (p) => p,
  });
}

export function useWaitlistStats() {
  return useQuery({
    queryKey: KEYS.stats,
    queryFn: () => waitlistApi.getStats(),
    select: (res) => extractItem<any>(res),
  });
}

export function useJoinWaitlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: waitlistApi.join,
    onSuccess: () => {
      toast.success("Added to waitlist");
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useNotifyEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: waitlistApi.notify,
    onSuccess: () => {
      toast.success("Client notified");
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useConvertEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: waitlistApi.convert,
    onSuccess: () => {
      toast.success("Converted to appointment");
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useCancelEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => waitlistApi.cancel(id),
    onSuccess: () => {
      toast.success("Entry cancelled");
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}
