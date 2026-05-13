"use client";

import { useQuery } from "@tanstack/react-query";
import reportsApi from "@/lib/api/reports";
import { extractItem, extractArray } from "@/lib/api/response";

const sel = (res: any) => extractItem<any>(res);

export const useOverviewReport = (p?: any) =>
  useQuery({
    queryKey: ["reports", "overview", p],
    queryFn: () => reportsApi.getOverview(p),
    select: sel,
    placeholderData: (x) => x,
  });
export const useTrendReport = (p?: any) =>
  useQuery({
    queryKey: ["reports", "trend", p],
    queryFn: () => reportsApi.getTrend(p),
    select: sel,
    placeholderData: (x) => x,
  });
export const useInvoiceReport = (p?: any) =>
  useQuery({
    queryKey: ["reports", "invoices", p],
    queryFn: () => reportsApi.getInvoices(p),
    select: sel,
    placeholderData: (x) => x,
  });
export const useServiceReport = (p?: any) =>
  useQuery({
    queryKey: ["reports", "services", p],
    queryFn: () => reportsApi.getServices(p),
    select: sel,
    placeholderData: (x) => x,
  });
export const useDoctorReport = (p?: any) =>
  useQuery({
    queryKey: ["reports", "doctors", p],
    queryFn: () => reportsApi.getDoctors(p),
    select: sel,
    placeholderData: (x) => x,
  });
export const useClientReport = (p?: any) =>
  useQuery({
    queryKey: ["reports", "clients", p],
    queryFn: () => reportsApi.getClients(p),
    select: sel,
    placeholderData: (x) => x,
  });
export const useNoShowReport = (p?: any) =>
  useQuery({
    queryKey: ["reports", "no-shows", p],
    queryFn: () => reportsApi.getNoShows(p),
    select: sel,
    placeholderData: (x) => x,
  });
export const usePeakHoursReport = (p?: any) =>
  useQuery({
    queryKey: ["reports", "peak-hours", p],
    queryFn: () => reportsApi.getPeakHours(p),
    select: sel,
    placeholderData: (x) => x,
  });
export const useTreatmentPlanReport = (p?: any) =>
  useQuery({
    queryKey: ["reports", "plans", p],
    queryFn: () => reportsApi.getTreatmentPlans(p),
    select: sel,
    placeholderData: (x) => x,
  });
export const useAgingReport = (p?: any) =>
  useQuery({
    queryKey: ["reports", "aging", p],
    queryFn: () => reportsApi.getAging(p),
    select: sel,
    placeholderData: (x) => x,
  });
