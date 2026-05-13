import api from "./client";

const feedbackApi = {
  list: (params?: any) => api.get("/feedback", { params }),
  getById: (id: string) => api.get(`/feedback/${id}`),
  getByAppointment: (appointmentId: string) =>
    api.get(`/appointments/${appointmentId}/feedback`),
  getStats: (params?: any) => api.get("/feedback/stats", { params }),
  respond: (id: string, dto: any) => api.patch(`/feedback/${id}/respond`, dto),
};

export default feedbackApi;
