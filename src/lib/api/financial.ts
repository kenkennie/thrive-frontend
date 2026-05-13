import api from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type InvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "VOID"
  | "OVERDUE";
export type QuoteStatus =
  | "DRAFT"
  | "SENT"
  | "ACCEPTED"
  | "DECLINED"
  | "EXPIRED"
  | "CONVERTED";
export type PaymentMethod =
  | "CASH"
  | "MPESA"
  | "CARD"
  | "BANK_TRANSFER"
  | "CHEQUE"
  | "INSURANCE"
  | "OTHER";

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  service?: { id: string; name: string };
  variant?: { name: string } | null;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  amountKes: number;
  method: PaymentMethod;
  reference?: string;
  note?: string;
  paidAt: string;
  recordedBy: { fullName: string };
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  currency: string;
  subtotal: number;
  vatAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  vatRate?: number;
  discountPercent?: number;
  notes?: string;
  dueDate?: string;
  issuedAt?: string;
  voidedAt?: string;
  createdAt: string;
  client: { id: string; fullName: string; email?: string; phoneNumber: string };
  appointment?: { id: string; date: string; startTime: string } | null;
  lineItems: InvoiceLineItem[];
  payments: Payment[];
  creditNotes?: any[];
}

export interface Quote {
  id: string;
  quoteNumber: string;
  status: QuoteStatus;
  currency: string;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  validUntil?: string;
  notes?: string;
  sentAt?: string;
  acceptedAt?: string;
  declinedAt?: string;
  createdAt: string;
  client: { id: string; fullName: string; email?: string; phoneNumber: string };
  lineItems: InvoiceLineItem[];
}

export interface CreditNote {
  id: string;
  creditNumber: string;
  amount: number;
  currency: string;
  reason: string;
  createdAt: string;
  invoice: { id: string; invoiceNumber: string };
  client: { id: string; fullName: string };
}

export interface RecordPaymentDto {
  invoiceId: string;
  amount: number;
  currency?: string;
  method: PaymentMethod;
  reference?: string;
  note?: string;
  paidAt?: string;
}

export interface ListQuery {
  clientId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ─── API ──────────────────────────────────────────────────────────────────────

const financialApi = {
  // ── Invoices ──────────────────────────────────────────────────────────────
  listInvoices: (p?: ListQuery) => api.get("/invoices", { params: p }),
  getInvoice: (id: string) => api.get(`/invoices/${id}`),
  createInvoice: (dto: any) => api.post("/invoices", dto),
  updateInvoice: (id: string, dto: any) => api.patch(`/invoices/${id}`, dto),
  issueInvoice: (id: string) => api.post(`/invoices/${id}/issue`),
  voidInvoice: (id: string, reason?: string) =>
    api.patch(`/invoices/${id}/void`, { reason }),
  applyDiscount: (
    id: string,
    dto: { type: "PERCENT" | "FIXED"; value: number },
  ) => api.patch(`/invoices/${id}/discount`, dto),

  // ── Payments ──────────────────────────────────────────────────────────────
  recordPayment: (dto: RecordPaymentDto) => api.post("/payments", dto),
  listPayments: (p?: ListQuery) => api.get("/payments", { params: p }),
  getPayment: (id: string) => api.get(`/payments/${id}`),
  refundPayment: (id: string, reason?: string) =>
    api.post(`/payments/${id}/refund`, { reason }),

  // ── Quotes ────────────────────────────────────────────────────────────────
  listQuotes: (p?: ListQuery) => api.get("/quotes", { params: p }),
  getQuote: (id: string) => api.get(`/quotes/${id}`),
  createQuote: (dto: any) => api.post("/quotes", dto),
  updateQuote: (id: string, dto: any) => api.patch(`/quotes/${id}`, dto),
  sendQuote: (id: string) => api.patch(`/quotes/${id}/send`),
  acceptQuote: (id: string) => api.patch(`/quotes/${id}/accept`),
  declineQuote: (id: string, reason?: string) =>
    api.patch(`/quotes/${id}/decline`, { reason }),
  convertQuote: (id: string) => api.post(`/quotes/${id}/convert`),

  // ── Credit & Debit Notes ─────────────────────────────────────────────────
  listCreditNotes: (p?: any) => api.get("/credit-notes", { params: p }),
  createCreditNote: (dto: any) => api.post("/credit-notes", dto),
  applyCreditNote: (id: string, targetInvoiceId: string) =>
    api.post(`/credit-notes/${id}/apply`, { targetInvoiceId }),
  voidCreditNote: (id: string, reason: string) =>
    api.post(`/credit-notes/${id}/void`, { reason }),
  createDebitNote: (dto: any) => api.post("/debit-notes", dto),
  markDebitNotePaid: (id: string, paymentReference?: string) =>
    api.post(`/debit-notes/${id}/mark-paid`, { paymentReference }),
  voidDebitNote: (id: string, reason: string) =>
    api.post(`/debit-notes/${id}/void`, { reason }),

  // ── PDF ───────────────────────────────────────────────────────────────────
  downloadInvoicePdf: (id: string) =>
    `${process.env.NEXT_PUBLIC_API_URL}/pdf/invoice/${id}`,
  downloadQuotePdf: (id: string) =>
    `${process.env.NEXT_PUBLIC_API_URL}/pdf/quote/${id}`,
  downloadReceiptPdf: (paymentId: string) =>
    `${process.env.NEXT_PUBLIC_API_URL}/pdf/receipt/${paymentId}`,
  downloadStatementPdf: (clientId: string) =>
    `${process.env.NEXT_PUBLIC_API_URL}/pdf/client-statement/${clientId}`,
  downloadCreditNotePdf: (id: string) =>
    `${process.env.NEXT_PUBLIC_API_URL}/pdf/credit-note/${id}`,
};

export default financialApi;
