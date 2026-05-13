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
  getOverview: (params?: any) => api.get("/reports/overview", { params }),
  getTrend: (params?: any) => api.get("/reports/trend", { params }),
  getInvoices: (params?: any) => api.get("/reports/invoices", { params }),
  getServices: (params?: any) => api.get("/reports/services", { params }),
  getDoctors: (params?: any) => api.get("/reports/doctors", { params }),
  getClients: (params?: any) => api.get("/reports/clients", { params }),
  getNoShows: (params?: any) => api.get("/reports/no-shows", { params }),
  getPeakHours: (params?: any) => api.get("/reports/peak-hours", { params }),
  getTreatmentPlans: (params?: any) =>
    api.get("/reports/treatment-plans", { params }),
  getAging: (params?: any) => api.get("/reports/aging", { params }),
};

export default reportsApi;
