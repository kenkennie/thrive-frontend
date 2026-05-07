import api from "./client";
import type { ApiResponse } from "@/types/api";

export interface OverviewSummary {
  period: { from: string; to: string };
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
    noShows: number;
    completionRate: number;
    noShowRate: number;
  };
  clients: { new: number; returning: number; total: number };
  revenue: {
    kes: number;
    usd: number;
    totalKes: number;
    refunds: number;
    net: number;
  };
  paymentMethods: { method: string; amountKes: number }[];
}

export interface TrendData {
  data: {
    label: string;
    bookings: number;
    completed: number;
    revenueKes: number;
    revenueUsd: number;
  }[];
}

const reportsApi = {
  getOverview: (params?: {
    preset?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => api.get<ApiResponse<OverviewSummary>>("/reports/overview", { params }),

  getTrend: (params?: { preset?: string; groupBy?: string }) =>
    api.get<ApiResponse<TrendData>>("/reports/trend", { params }),
};

export default reportsApi;
