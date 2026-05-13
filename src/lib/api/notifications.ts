import api from "./client";

const notificationsApi = {
  list: (params?: any) => api.get("/notifications", { params }),
  retry: (id: string) => api.post(`/notifications/${id}/retry`),
  cancel: (id: string) => api.patch(`/notifications/${id}/cancel`),
};

export default notificationsApi;
