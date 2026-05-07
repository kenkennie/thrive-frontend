import api from "./client";
import type { PaginatedResponse, ApiResponse } from "@/types/api";

export interface AppointmentService {
  service: { id: string; name: string; color?: string };
  variant?: { name: string } | null;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  durationMin?: number;
  sortOrder: number;
}

export interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  clientNotes?: string;
  internalNotes?: string;
  documentChoice: string;
  arrivedAt?: string;
  checkedInAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  noShowAt?: string;
  createdAt: string;
  client: {
    id: string;
    fullName: string;
    email?: string;
    phoneNumber: string;
    avatarUrl?: string;
    noShowCount: number;
  };
  doctor: { id: string; fullName: string; avatarUrl?: string };
  status: {
    name: string;
    label: string;
    color: string;
    isCompleted: boolean;
    isCancelled: boolean;
    isNoShow: boolean;
    isCheckedIn: boolean;
    isArrived: boolean;
  };
  appointmentServices: AppointmentService[];
  invoice?: {
    id: string;
    invoiceNumber: string;
    status: string;
    totalAmount: number;
    amountDue: number;
    currency: string;
  };
  treatmentPlan?: { id: string; title: string } | null;
  source?: { name: string; label: string } | null;
}

export interface ListAppointmentsQuery {
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  doctorId?: string;
  clientId?: string;
  statusId?: string;
  statusName?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateAppointmentDto {
  clientId: string;
  doctorId: string;
  date: string;
  startTime: string;
  documentChoice?: string;
  clientNotes?: string;
  internalNotes?: string;
  sourceId?: string;
  services: {
    serviceId: string;
    variantId?: string;
    quantity?: number;
    durationMin?: number;
  }[];
}

const appointmentsApi = {
  list: (params?: ListAppointmentsQuery) =>
    api.get<PaginatedResponse<Appointment>>("/appointments", { params }),

  getById: (id: string) =>
    api.get<ApiResponse<Appointment>>(`/appointments/${id}`),

  create: (dto: CreateAppointmentDto) =>
    api.post<ApiResponse<Appointment>>("/appointments", dto),

  update: (id: string, dto: Partial<CreateAppointmentDto>) =>
    api.patch<ApiResponse<Appointment>>(`/appointments/${id}`, dto),

  getDailySchedule: (params: { date: string; doctorId?: string }) =>
    api.get<ApiResponse<{ slots: any[]; appointments: Appointment[] }>>(
      "/appointments/schedule/daily",
      { params },
    ),

  getAvailability: (params: {
    serviceIds: string[];
    doctorId?: string;
    date: string;
  }) =>
    api.get<ApiResponse<{ slots: string[] }>>("/appointments/availability", {
      params,
    }),

  confirm: (id: string) =>
    api.patch<ApiResponse<Appointment>>(`/appointments/${id}/confirm`),
  arrive: (id: string) =>
    api.patch<ApiResponse<Appointment>>(`/appointments/${id}/arrive`),
  checkIn: (id: string) =>
    api.patch<ApiResponse<Appointment>>(`/appointments/${id}/check-in`),
  start: (id: string) =>
    api.patch<ApiResponse<Appointment>>(`/appointments/${id}/start`),
  complete: (id: string) =>
    api.patch<ApiResponse<Appointment>>(`/appointments/${id}/complete`),
  noShow: (id: string) =>
    api.patch<ApiResponse<Appointment>>(`/appointments/${id}/no-show`),
  cancel: (id: string, reason?: string) =>
    api.patch<ApiResponse<Appointment>>(`/appointments/${id}/cancel`, {
      reason,
    }),
};

export default appointmentsApi;
