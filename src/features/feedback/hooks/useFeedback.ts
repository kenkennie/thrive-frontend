"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import feedbackApi from "@/lib/api/feedback";
import { extractArray, extractItem } from "@/lib/api/response";

const KEYS = {
  list: (q: any) => ["feedback", "list", q] as const,
  stats: (q: any) => ["feedback", "stats", q] as const,
  item: (id: string) => ["feedback", id] as const,
  appt: (id: string) => ["feedback", "appointment", id] as const,
};

export function useFeedbackList(q?: any) {
  return useQuery({
    queryKey: KEYS.list(q),
    queryFn: () => feedbackApi.list(q),
    select: (res) => ({
      data: extractArray(res),
      meta: (res as any)?.data?.meta ?? null,
    }),
    placeholderData: (p) => p,
  });
}

export function useFeedbackStats(params?: any) {
  return useQuery({
    queryKey: KEYS.stats(params),
    queryFn: () => feedbackApi.getStats(params),
    select: (res) => extractItem<any>(res),
  });
}

export function useAppointmentFeedback(appointmentId: string) {
  return useQuery({
    queryKey: KEYS.appt(appointmentId),
    queryFn: () => feedbackApi.getByAppointment(appointmentId),
    enabled: !!appointmentId,
    select: (res) => extractItem<any>(res),
    retry: false,
  });
}

export function useRespondToFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: any) => feedbackApi.respond(id, dto),
    onSuccess: () => {
      toast.success("Response saved");
      qc.invalidateQueries({ queryKey: ["feedback"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}
