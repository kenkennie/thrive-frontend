import api from "./client";

export interface ClinicSettings {
  id: string;
  clinicName: string;
  logoUrl?: string;
  tagline?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  website?: string;
  // Finance
  baseCurrency: string;
  vatRate?: number;
  invoicePrefix: string;
  quotePrefix: string;
  creditNotePrefix: string;
  debitNotePrefix: string;
  invoiceDueDays: number;
  defaultPaymentTerms?: string;
  autoGenerateInvoice: boolean;
  // Booking
  bookingOpenDays: number;
  bufferTimeMin: number;
  cancellationHours: number;
  cancellationFeePercentage: number;
  autoConfirmBookings: boolean;
  requireIntakeForNewClients: boolean;
  requireIntakeFormBeforeConfirmation: boolean;
  intakeValidityDays: number;
  noShowAutoFlagMinutes: number;
  waitlistExpiryHours: number;
  // Notifications
  sendAppointmentReminder: boolean;
  reminderHoursBefore: number;
  sendCancellationNotification: boolean;
  sendCompletionFollowUp: boolean;
  followUpHoursAfter: number;
  sendInvoiceEmail: boolean;
  sendPaymentConfirmation: boolean;
  // Features
  enableDashboard: boolean;
  enableAppointments: boolean;
  enableClients: boolean;
  enableClinical: boolean;
  enableServices: boolean;
  enableInvoices: boolean;
  enablePayments: boolean;
  enableReports: boolean;
  enableStaff: boolean;
  enableNotifications: boolean;
  enableSettings: boolean;
  enableTreatmentPlans: boolean;
}

export interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  setBy?: { fullName: string };
  createdAt: string;
  isActive: boolean;
}

export interface LookupItem {
  id: string;
  name: string;
  label: string;
  isSystem?: boolean;
  isActive?: boolean;
  color?: string;
  sortOrder?: number;
}

const settingsApi = {
  get: () => api.get("/settings"),
  update: (dto: Partial<ClinicSettings>) => api.patch("/settings", dto),
  uploadLogo: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/settings/logo", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Exchange rates
  getExchangeRates: () => api.get("/settings/exchange-rates"),
  createExchangeRate: (dto: {
    fromCurrency: string;
    toCurrency: string;
    rate: number;
  }) => api.post("/settings/exchange-rates", dto),
  updateExchangeRate: (id: string, rate: number) =>
    api.patch(`/settings/exchange-rates/${id}`, { rate }),

  // Lookups
  getGenders: () => api.get("/settings/lookups/genders"),
  getSkinTypes: () => api.get("/settings/lookups/skin-types"),
  getAppointmentStatuses: () =>
    api.get("/settings/lookups/appointment-statuses"),
  getBookingSources: () => api.get("/settings/lookups/booking-sources"),
  getServiceTypes: () => api.get("/settings/lookups/service-types"),

  createLookup: (
    type: string,
    dto: { name: string; label: string; color?: string },
  ) => api.post(`/settings/lookups/${type}`, dto),
  updateLookup: (type: string, id: string, dto: Partial<LookupItem>) =>
    api.patch(`/settings/lookups/${type}/${id}`, dto),
  deleteLookup: (type: string, id: string) =>
    api.delete(`/settings/lookups/${type}/${id}`),
};

export default settingsApi;
