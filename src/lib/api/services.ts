import api from "./client";

export interface Service {
  id: string;
  name: string;
  description?: string;
  color?: string;
  serviceType: string;
  durationMin: number;
  price: number;
  currency: string;
  isActive: boolean;
  category?: { id: string; name: string };
  variants?: { id: string; name: string; durationMin: number; price: number }[];
}

export interface Doctor {
  id: string;
  fullName: string;
  avatarUrl?: string;
}

const servicesApi = {
  list: (params?: any) => api.get("/services", { params }),
  getById: (id: string) => api.get(`/services/${id}`),
  getDoctors: (serviceId: string) => api.get(`/services/${serviceId}/doctors`),
  getAvailability: (params: any) =>
    api.get("/services/availability", { params }),
};

export default servicesApi;
