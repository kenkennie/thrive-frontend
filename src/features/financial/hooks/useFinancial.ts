// src/features/financial/hooks/useFinancial.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import financialApi from "@/lib/api/financial";
import { extractArray, extractItem } from "@/lib/api/response";

export const FIN_KEYS = {
  invoices: (q: any) => ["invoices", q] as const,
  invoice: (id: string) => ["invoices", id] as const,
  quotes: (q: any) => ["quotes", q] as const,
  quote: (id: string) => ["quotes", id] as const,
  payments: (q: any) => ["payments", q] as const,
  creditNotes: (q: any) => ["credit-notes", q] as const,
};

// ── Invoices ──────────────────────────────────────────────────────────────────

export function useInvoiceList(q?: any) {
  return useQuery({
    queryKey: FIN_KEYS.invoices(q),
    queryFn: () => financialApi.listInvoices(q),
    select: (res) => ({
      data: extractArray(res),
      meta: (res as any)?.data?.meta ?? null,
    }),
    placeholderData: (p) => p,
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: FIN_KEYS.invoice(id),
    queryFn: () => financialApi.getInvoice(id),
    enabled: !!id,
    select: (res) => extractItem<any>(res),
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: financialApi.createInvoice,
    onSuccess: () => {
      toast.success("Invoice created");
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to create invoice"),
  });
}

export function useUpdateInvoice(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => financialApi.updateInvoice(id, dto),
    onSuccess: () => {
      toast.success("Invoice updated");
      qc.invalidateQueries({ queryKey: FIN_KEYS.invoice(id) });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to update invoice"),
  });
}

export function useIssueInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financialApi.issueInvoice(id),
    onSuccess: (_, id) => {
      toast.success("Invoice issued");
      qc.invalidateQueries({ queryKey: FIN_KEYS.invoice(id) });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useVoidInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      financialApi.voidInvoice(id, reason),
    onSuccess: (_, { id }) => {
      toast.success("Invoice voided");
      qc.invalidateQueries({ queryKey: FIN_KEYS.invoice(id) });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useApplyDiscount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: any) => financialApi.applyDiscount(id, dto),
    onSuccess: (_, { id }) => {
      toast.success("Discount applied");
      qc.invalidateQueries({ queryKey: FIN_KEYS.invoice(id) });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

// ── Payments ──────────────────────────────────────────────────────────────────

export function usePaymentList(q?: any) {
  return useQuery({
    queryKey: FIN_KEYS.payments(q),
    queryFn: () => financialApi.listPayments(q),
    select: (res) => ({
      data: extractArray(res),
      meta: (res as any)?.data?.meta ?? null,
    }),
    placeholderData: (p) => p,
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: financialApi.recordPayment,
    onSuccess: () => {
      toast.success("Payment recorded");
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to record payment"),
  });
}

export function useRefundPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      financialApi.refundPayment(id, reason),
    onSuccess: () => {
      toast.success("Refund processed");
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

// ── Quotes ────────────────────────────────────────────────────────────────────

export function useQuoteList(q?: any) {
  return useQuery({
    queryKey: FIN_KEYS.quotes(q),
    queryFn: () => financialApi.listQuotes(q),
    select: (res) => ({
      data: extractArray(res),
      meta: (res as any)?.data?.meta ?? null,
    }),
    placeholderData: (p) => p,
  });
}

export function useQuote(id: string) {
  return useQuery({
    queryKey: FIN_KEYS.quote(id),
    queryFn: () => financialApi.getQuote(id),
    enabled: !!id,
    select: (res) => extractItem<any>(res),
  });
}

export function useCreateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: financialApi.createQuote,
    onSuccess: () => {
      toast.success("Quote created");
      qc.invalidateQueries({ queryKey: ["quotes"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useSendQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financialApi.sendQuote(id),
    onSuccess: (_, id) => {
      toast.success("Quote sent");
      qc.invalidateQueries({ queryKey: FIN_KEYS.quote(id) });
      qc.invalidateQueries({ queryKey: ["quotes"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useAcceptQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financialApi.acceptQuote(id),
    onSuccess: (_, id) => {
      toast.success("Quote accepted");
      qc.invalidateQueries({ queryKey: FIN_KEYS.quote(id) });
      qc.invalidateQueries({ queryKey: ["quotes"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useDeclineQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      financialApi.declineQuote(id, reason),
    onSuccess: (_, { id }) => {
      toast.success("Quote declined");
      qc.invalidateQueries({ queryKey: FIN_KEYS.quote(id) });
      qc.invalidateQueries({ queryKey: ["quotes"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useConvertQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financialApi.convertQuote(id),
    onSuccess: () => {
      toast.success("Quote converted to invoice");
      qc.invalidateQueries({ queryKey: ["quotes"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useCreateCreditNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: financialApi.createCreditNote,
    onSuccess: () => {
      toast.success("Credit note issued");
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useCreateDebitNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: financialApi.createDebitNote,
    onSuccess: () => {
      toast.success("Debit note issued");
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}
