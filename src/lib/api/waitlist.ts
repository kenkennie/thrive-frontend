import api from "./client";

export type WaitlistStatus =
  | "WAITING"
  | "NOTIFIED"
  | "BOOKED"
  | "EXPIRED"
  | "CANCELLED";

export interface WaitlistEntry {
  id: string;
  status: WaitlistStatus;
  preferredDate: string;
  flexibleDate: boolean;
  note?: string;
  joinedAt: string;
  notifiedAt?: string;
  expiresAt?: string;
  bookedAppointmentId?: string;
  client: { id: string; fullName: string; email?: string; phoneNumber: string };
  service: { id: string; name: string; durationMin: number; price: number };
}

const waitlistApi = {
  list: (params?: any) => api.get("/waitlist", { params }),
  getById: (id: string) => api.get(`/waitlist/${id}`),
  getStats: () => api.get("/waitlist/stats"),
  join: (dto: any) => api.post("/waitlist", dto),
  notify: (dto: any) => api.post("/waitlist/notify", dto),
  convert: (dto: any) => api.post("/waitlist/convert", dto),
  cancel: (id: string) => api.patch(`/waitlist/${id}/cancel`),
};

export default waitlistApi;
