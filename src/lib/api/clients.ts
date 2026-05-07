import api from "./client";

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

export interface ListClientsQuery {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

// Named functions — avoids the .list is not a function error
export const listClients = (params?: ListClientsQuery) =>
  api.get("/clients", { params });

export const getClient = (id: string) => api.get(`/clients/${id}`);

export const createClient = (dto: CreateClientDto) => api.post("/clients", dto);

export const updateClient = (id: string, dto: Partial<CreateClientDto>) =>
  api.patch(`/clients/${id}`, dto);

export const recordPhotoConsent = (id: string, given: boolean) =>
  api.post(`/clients/${id}/photo-consent`, { given });

export const getClientHistory = (id: string) =>
  api.get(`/clients/${id}/treatment-history`);

export const getClientIntakeForms = (id: string) =>
  api.get(`/clients/${id}/intake-forms`);

export const getClientPhotos = (id: string, params?: any) =>
  api.get(`/clients/${id}/photos`, { params });

// Default export as object (for backward compat)
const clientsApi = {
  list: listClients,
  getById: getClient,
  create: createClient,
  update: updateClient,
  recordPhotoConsent,
  getTreatmentHistory: getClientHistory,
  getIntakeForms: getClientIntakeForms,
  getPhotos: getClientPhotos,
  getInvoices: (id: string) =>
    api.get("/invoices", { params: { clientId: id } }),
  getAppointments: (id: string, params?: any) =>
    api.get(`/clients/${id}/appointments`, { params }),
};

export default clientsApi;
