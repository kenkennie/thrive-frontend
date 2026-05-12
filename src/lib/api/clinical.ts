import api from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlanStatus = "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";
export type SessionStatus = "PENDING" | "COMPLETED" | "MISSED";
export type PlanPaymentModel = "PER_SESSION" | "UPFRONT" | "DEPOSIT";

export interface TreatmentPlan {
  id: string;
  title: string;
  description?: string;
  status: PlanStatus;
  paymentModel: PlanPaymentModel;
  totalSessions: number;
  completedSessions: number;
  sessionFrequencyDays?: number;
  totalPrice?: number;
  depositAmount?: number;
  depositPaid: boolean;
  depositPaidAt?: string;
  startedAt?: string;
  completedAt?: string;
  pausedAt?: string;
  pauseReason?: string;
  notes?: string;
  createdAt: string;
  client: { id: string; fullName: string; phoneNumber: string; email?: string };
  doctor: { id: string; fullName: string; avatarUrl?: string };
  sessions?: TreatmentSession[];
  invoices?: any[];
  quotes?: any[];
}

export interface TreatmentSession {
  id: string;
  sessionNumber?: number;
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  treatmentPerformed?: string;
  productsUsed?: string;
  equipmentUsed?: string;
  settingsUsed?: string;
  skinReaction?: string;
  aftercareInstructions?: string;
  clientFeedbackDuringSession?: string;
  followUpRequired: boolean;
  followUpNotes?: string;
  followUpDate?: string;
  visibleToClient: boolean;
  doctor: { id: string; fullName: string };
  appointment?: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    status: { name: string; label: string; color?: string };
    appointmentServices: {
      service: { id: string; name: string };
      variant?: { name: string } | null;
    }[];
  };
  treatmentPlan?: {
    id: string;
    title: string;
    totalSessions: number;
    completedSessions: number;
  } | null;
  photos?: {
    id: string;
    photoUrl: string;
    thumbnailUrl?: string;
    type: string;
    caption?: string;
    uploadedAt: string;
  }[];
}

// ─── API ─────────────────────────────────────────────────────────────────────

const clinicalApi = {
  // ── Treatment plans ──────────────────────────────────────────────────────
  listPlans: (params?: any) => api.get("/treatment-plans", { params }),
  getPlan: (id: string) => api.get(`/treatment-plans/${id}`),
  createPlan: (dto: any) => api.post("/treatment-plans", dto),
  updatePlan: (id: string, dto: any) =>
    api.patch(`/treatment-plans/${id}`, dto),
  pausePlan: (id: string, reason: string) =>
    api.patch(`/treatment-plans/${id}/pause`, { reason }),
  resumePlan: (id: string) => api.patch(`/treatment-plans/${id}/resume`),
  completePlan: (id: string) => api.patch(`/treatment-plans/${id}/complete`),
  cancelPlan: (id: string, reason: string) =>
    api.patch(`/treatment-plans/${id}/cancel`, { reason }),
  getPlanProgress: (id: string) => api.get(`/treatment-plans/${id}/progress`),
  recordDeposit: (id: string, dto: any) =>
    api.patch(`/treatment-plans/${id}/deposit`, dto),
  linkSession: (planId: string, dto: any) =>
    api.post(`/treatment-plans/${planId}/sessions`, dto),

  // ── Sessions ─────────────────────────────────────────────────────────────
  getSessionByAppointment: (appointmentId: string) =>
    api.get(`/appointments/${appointmentId}/session`),
  getSession: (sessionId: string) => api.get(`/sessions/${sessionId}`),
  createSessionNote: (appointmentId: string, dto: any) =>
    api.post(`/appointments/${appointmentId}/session`, dto),
  updateSession: (sessionId: string, dto: any) =>
    api.patch(`/sessions/${sessionId}`, dto),
  completeSession: (planId: string, sessionId: string, dto: any) =>
    api.patch(`/treatment-plans/${planId}/sessions/${sessionId}/complete`, dto),
  markMissed: (planId: string, sessionId: string) =>
    api.patch(`/treatment-plans/${planId}/sessions/${sessionId}/missed`),
  listByClient: (clientId: string) => api.get(`/clients/${clientId}/sessions`),

  // ── Photos ────────────────────────────────────────────────────────────────
  listPhotos: (clientId: string, params?: any) =>
    api.get(`/clients/${clientId}/photos`, { params }),
  uploadPhoto: (clientId: string, dto: any) =>
    api.post(`/clients/${clientId}/photos`, dto),
  updatePhoto: (photoId: string, dto: any) =>
    api.patch(`/photos/${photoId}`, dto),
  deletePhoto: (photoId: string) => api.delete(`/photos/${photoId}`),

  // ── Clinical summary ──────────────────────────────────────────────────────
  getClinicalSummary: (clientId: string) =>
    api.get(`/clients/${clientId}/clinical-summary`),
};

export default clinicalApi;
