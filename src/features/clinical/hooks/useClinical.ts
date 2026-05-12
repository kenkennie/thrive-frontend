"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import clinicalApi from "@/lib/api/clinical";
import { extractArray, extractItem } from "@/lib/api/response";

export const CLINICAL_KEYS = {
  plans: (q: any) => ["treatment-plans", q] as const,
  plan: (id: string) => ["treatment-plans", id] as const,
  progress: (id: string) => ["treatment-plans", id, "progress"] as const,
  session: (id: string) => ["sessions", id] as const,
  apptSession: (id: string) => ["appointments", id, "session"] as const,
  clientSessions: (id: string) => ["clients", id, "sessions"] as const,
  photos: (clientId: string, q?: any) =>
    ["clients", clientId, "photos", q] as const,
  summary: (clientId: string) =>
    ["clients", clientId, "clinical-summary"] as const,
};

const inv = (qc: any, keys: any[]) =>
  keys.forEach((k) => qc.invalidateQueries({ queryKey: k }));

// ── Plans ─────────────────────────────────────────────────────────────────────

export function usePlanList(q?: any) {
  return useQuery({
    queryKey: CLINICAL_KEYS.plans(q),
    queryFn: () => clinicalApi.listPlans(q),
    select: (res) => ({
      data: extractArray(res),
      meta: (res as any)?.data?.meta ?? null,
    }),
    placeholderData: (p) => p,
  });
}

export function usePlan(id: string) {
  return useQuery({
    queryKey: CLINICAL_KEYS.plan(id),
    queryFn: () => clinicalApi.getPlan(id),
    enabled: !!id,
    select: (res) => extractItem<any>(res),
  });
}

export function usePlanProgress(id: string) {
  return useQuery({
    queryKey: CLINICAL_KEYS.progress(id),
    queryFn: () => clinicalApi.getPlanProgress(id),
    enabled: !!id,
    select: (res) => extractItem<any>(res),
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: clinicalApi.createPlan,
    onSuccess: () => {
      toast.success("Treatment plan created");
      qc.invalidateQueries({ queryKey: ["treatment-plans"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useUpdatePlan(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => clinicalApi.updatePlan(id, dto),
    onSuccess: () => {
      toast.success("Plan updated");
      inv(qc, [CLINICAL_KEYS.plan(id)]);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function usePausePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      clinicalApi.pausePlan(id, reason),
    onSuccess: (_, { id }) => {
      toast.success("Plan paused");
      inv(qc, [CLINICAL_KEYS.plan(id)]);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useResumePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clinicalApi.resumePlan(id),
    onSuccess: (_, id) => {
      toast.success("Plan resumed");
      inv(qc, [CLINICAL_KEYS.plan(id)]);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useCompletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clinicalApi.completePlan(id),
    onSuccess: (_, id) => {
      toast.success("Plan completed");
      inv(qc, [CLINICAL_KEYS.plan(id)]);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useCancelPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      clinicalApi.cancelPlan(id, reason),
    onSuccess: (_, { id }) => {
      toast.success("Plan cancelled");
      inv(qc, [CLINICAL_KEYS.plan(id)]);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useRecordDeposit(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => clinicalApi.recordDeposit(planId, dto),
    onSuccess: () => {
      toast.success("Deposit recorded");
      inv(qc, [CLINICAL_KEYS.plan(planId)]);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useLinkSession(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => clinicalApi.linkSession(planId, dto),
    onSuccess: () => {
      toast.success("Session linked");
      inv(qc, [CLINICAL_KEYS.plan(planId)]);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useMarkMissed(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      clinicalApi.markMissed(planId, sessionId),
    onSuccess: () => {
      toast.success("Session marked as missed");
      inv(qc, [CLINICAL_KEYS.plan(planId)]);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export function useAppointmentSession(appointmentId: string) {
  return useQuery({
    queryKey: CLINICAL_KEYS.apptSession(appointmentId),
    queryFn: () => clinicalApi.getSessionByAppointment(appointmentId),
    enabled: !!appointmentId,
    select: (res) => extractItem<any>(res),
    retry: false,
  });
}

export function useSession(sessionId: string) {
  return useQuery({
    queryKey: CLINICAL_KEYS.session(sessionId),
    queryFn: () => clinicalApi.getSession(sessionId),
    enabled: !!sessionId,
    select: (res) => extractItem<any>(res),
  });
}

export function useCreateSessionNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ appointmentId, dto }: { appointmentId: string; dto: any }) =>
      clinicalApi.createSessionNote(appointmentId, dto),
    onSuccess: (_, { appointmentId }) => {
      toast.success("Session note saved");
      qc.invalidateQueries({
        queryKey: CLINICAL_KEYS.apptSession(appointmentId),
      });
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to save note"),
  });
}

export function useUpdateSessionNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, dto }: { sessionId: string; dto: any }) =>
      clinicalApi.updateSession(sessionId, dto),
    onSuccess: (_, { sessionId }) => {
      toast.success("Session note updated");
      qc.invalidateQueries({ queryKey: CLINICAL_KEYS.session(sessionId) });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useCompleteSession(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, dto }: { sessionId: string; dto: any }) =>
      clinicalApi.completeSession(planId, sessionId, dto),
    onSuccess: () => {
      toast.success("Session completed");
      inv(qc, [CLINICAL_KEYS.plan(planId), ["treatment-plans"]]);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useClientSessions(clientId: string) {
  return useQuery({
    queryKey: CLINICAL_KEYS.clientSessions(clientId),
    queryFn: () => clinicalApi.listByClient(clientId),
    enabled: !!clientId,
    select: (res) => extractArray(res),
  });
}

// ── Photos ────────────────────────────────────────────────────────────────────

export function useClientPhotos(clientId: string, params?: any) {
  return useQuery({
    queryKey: CLINICAL_KEYS.photos(clientId, params),
    queryFn: () => clinicalApi.listPhotos(clientId, params),
    enabled: !!clientId,
    select: (res) => ({
      data: extractArray(res),
      meta: (res as any)?.data?.meta ?? null,
    }),
  });
}

export function useUploadPhoto(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => clinicalApi.uploadPhoto(clientId, dto),
    onSuccess: () => {
      toast.success("Photo uploaded");
      qc.invalidateQueries({ queryKey: ["clients", clientId, "photos"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useDeletePhoto(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (photoId: string) => clinicalApi.deletePhoto(photoId),
    onSuccess: () => {
      toast.success("Photo deleted");
      qc.invalidateQueries({ queryKey: ["clients", clientId, "photos"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

// ── Clinical summary ──────────────────────────────────────────────────────────

export function useClinicalSummary(clientId: string) {
  return useQuery({
    queryKey: CLINICAL_KEYS.summary(clientId),
    queryFn: () => clinicalApi.getClinicalSummary(clientId),
    enabled: !!clientId,
    select: (res) => extractItem<any>(res),
  });
}
