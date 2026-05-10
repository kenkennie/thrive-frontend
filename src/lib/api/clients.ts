import api from "./client";
import type { PaginatedResponse, ApiResponse } from "@/types/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Client {
  id: string;
  fullName: string;
  email?: string;
  phoneNumber: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  allergies?: string;
  medicalNotes?: string;
  photoConsentGiven: boolean;
  photoConsentAt?: string;
  noShowCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  gender?: { id: string; label: string };
  skinType?: { id: string; label: string };
}

export interface ClientIntakeForm {
  id: string;
  completedAt: string;
  skinConcerns?: string;
  currentMedications?: string;
  knownAllergies?: string;
  medicalConditions?: string;
  isPregnant: boolean;
  hasActiveSkinInfection: boolean;
  hasRecentSunExposure: boolean;
  onBloodThinners: boolean;
  hasHerpesHistory: boolean;
  treatmentConsentGiven: boolean;
  service?: { name: string };
}

export interface TreatmentSession {
  id: string;
  sessionNumber?: number;
  status: string;
  createdAt: string;
  treatmentPerformed?: string;
  productsUsed?: string;
  aftercareInstructions?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  visibleToClient: boolean;
  doctor: { id: string; fullName: string };
  appointment: {
    date: string;
    startTime: string;
    appointmentServices: { service: { id: string; name: string } }[];
  };
  treatmentPlan?: { id: string; title: string };
}

export interface BeforeAfterPhoto {
  id: string;
  photoUrl: string;
  thumbnailUrl?: string;
  type: "BEFORE" | "AFTER" | "PROGRESS";
  caption?: string;
  consentGiven: boolean;
  uploadedAt: string;
}

export interface CreateClientDto {
  fullName: string;
  phoneNumber: string;
  email?: string;
  dateOfBirth?: string;
  genderId?: string;
  skinTypeId?: string;
  allergies?: string;
  medicalNotes?: string;
}

export interface UpdateClientDto extends Partial<CreateClientDto> {}

export interface ListClientsQuery {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

// ─── API ──────────────────────────────────────────────────────────────────────

const clientsApi = {
  list: (params?: ListClientsQuery) =>
    api.get<PaginatedResponse<Client>>("/clients", { params }),

  getById: (id: string) => api.get<ApiResponse<Client>>(`/clients/${id}`),

  create: (dto: CreateClientDto) =>
    api.post<ApiResponse<Client>>("/clients", dto),

  update: (id: string, dto: UpdateClientDto) =>
    api.patch<ApiResponse<Client>>(`/clients/${id}`, dto),

  deactivate: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/clients/${id}`),

  // Treatment history
  getTreatmentHistory: (id: string) =>
    api.get<ApiResponse<TreatmentSession[]>>(
      `/clients/${id}/treatment-history`,
    ),

  // Intake forms
  getIntakeForms: (id: string) =>
    api.get<ApiResponse<ClientIntakeForm[]>>(`/clients/${id}/intake-forms`),

  // Photos
  getPhotos: (
    id: string,
    params?: { type?: string; page?: number; limit?: number },
  ) =>
    api.get<PaginatedResponse<BeforeAfterPhoto>>(`/clients/${id}/photos`, {
      params,
    }),

  uploadPhoto: (
    id: string,
    dto: {
      photoUrl: string;
      type: "BEFORE" | "AFTER" | "PROGRESS";
      caption?: string;
      consentGiven: boolean;
      treatmentSessionId?: string;
    },
  ) => api.post<ApiResponse<BeforeAfterPhoto>>(`/clients/${id}/photos`, dto),

// Photo consent
   recordPhotoConsent: (id: string, granted: boolean) =>
    api.post<ApiResponse<Client>>(`/clients/${id}/photo-consent`, { granted }),

  // Appointments
  getAppointments: (id: string, params?: { page?: number; limit?: number }) =>
    api.get(`/clients/${id}/appointments`, { params }),

  // Invoices
  getInvoices: (id: string, params?: { page?: number; limit?: number }) =>
    api.get(`/invoices`, { params: { clientId: id, ...params } }),
};

export default clientsApi;
