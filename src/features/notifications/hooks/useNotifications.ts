"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import notificationsApi from "@/lib/api/notifications";
import { extractArray } from "@/lib/api/response";

const KEYS = {
  list: (q: any) => ["notifications", "list", q] as const,
};

export function useNotificationList(q?: any) {
  return useQuery({
    queryKey: KEYS.list(q),
    queryFn: () => notificationsApi.list(q),
    select: (res) => ({
      data: extractArray(res),
      meta: (res as any)?.data?.meta ?? null,
    }),
    placeholderData: (p) => p,
    refetchInterval: 30_000,
  });
}

export function useRetryNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.retry(id),
    onSuccess: () => {
      toast.success("Notification queued for retry");
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useCancelNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.cancel(id),
    onSuccess: () => {
      toast.success("Notification cancelled");
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}
