"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import appointmentsApi, {
  type ListAppointmentsQuery,
} from "@/lib/api/appointments";
import { extractArray } from "@/lib/api/response";
import api from "@/lib/api/client";

export const APPT_KEYS = {
  all: ["appointments"] as const,
  list: (q: ListAppointmentsQuery) => ["appointments", "list", q] as const,
  detail: (id: string) => ["appointments", "detail", id] as const,
  daily: (date: string, doctorId?: string) =>
    ["appointments", "daily", date, doctorId] as const,
};

export function useAppointmentsList(query: ListAppointmentsQuery) {
  return useQuery({
    queryKey: APPT_KEYS.list(query),
    queryFn: () => appointmentsApi.list(query).then((r) => r.data),
  });
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: APPT_KEYS.detail(id),
    queryFn: () => appointmentsApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useDailySchedule(date: string, doctorId?: string) {
  return useQuery({
    queryKey: APPT_KEYS.daily(date, doctorId),
    queryFn: () =>
      appointmentsApi
        .getDailySchedule({ date, doctorId })
        .then((r) => r.data.data),
    enabled: !!date,
  });
}

// ── Status transition mutations ───────────────────────────────────────────────

function useStatusMutation(
  action: (...args: any[]) => Promise<any>,
  successMsg: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: () => {
      toast.success(successMsg);
      qc.invalidateQueries({ queryKey: APPT_KEYS.all });
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Action failed");
    },
  });
}

export const useConfirmAppointment = () =>
  useStatusMutation(
    (id) => appointmentsApi.confirm(id),
    "Appointment confirmed",
  );

export const useArriveAppointment = () =>
  useStatusMutation((id) => appointmentsApi.arrive(id), "Client arrived");

export const useCheckInAppointment = () =>
  useStatusMutation((id) => appointmentsApi.checkIn(id), "Client checked in");

export const useStartAppointment = () =>
  useStatusMutation((id) => appointmentsApi.start(id), "Session started");

export const useCompleteAppointment = () =>
  useStatusMutation((id) => appointmentsApi.complete(id), "Session completed");

export const useNoShowAppointment = () =>
  useStatusMutation((id) => appointmentsApi.noShow(id), "Marked as no-show");

export const useCancelAppointment = () =>
  useStatusMutation(
    ({ id, reason }: { id: string; reason?: string }) =>
      appointmentsApi.cancel(id, reason),
    "Appointment cancelled",
  );

export const useCreateAppointment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: appointmentsApi.create,
    onSuccess: () => {
      toast.success("Appointment booked");
      qc.invalidateQueries({ queryKey: APPT_KEYS.all });
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to create appointment");
    },
  });
};

export const useUpdateAppointment = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => appointmentsApi.update(id, dto),
    onSuccess: () => {
      toast.success("Appointment updated");
      qc.invalidateQueries({ queryKey: APPT_KEYS.all });
      qc.invalidateQueries({ queryKey: APPT_KEYS.detail(id) });
    },
    onError: (err: any) =>
      toast.error(err?.message ?? "Failed to update appointment"),
  });
};

export function useMonthAppointments(year: number, month: number) {
  // First and last day of the given month
  const dateFrom = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const dateTo = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  return useQuery({
    queryKey: ["appointments", "month", year, month],
    queryFn: () =>
      api.get("/appointments", {
        params: { dateFrom, dateTo, limit: 200 }, // 200 is enough for a month
      }),
    select: (res) => extractArray(res),
    placeholderData: (prev) => prev, // keeps previous month visible while loading
    staleTime: 60_000, // 1 min — month data rarely changes mid-view
  });
}
