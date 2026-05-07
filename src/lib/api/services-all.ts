import api from "./client";

export interface ServiceCategory {
  id: string;
  name: string;
  color?: string;
  isActive: boolean;
  _count?: { services: number };
}

export interface ServiceVariant {
  id: string;
  name: string;
  durationMin: number;
  price: number;
  currency: string;
  isActive: boolean;
}

export interface Contraindication {
  id: string;
  description: string;
  isCritical: boolean;
}

export interface ServiceDoctor {
  id: string;
  fullName: string;
  avatarUrl?: string;
  staffProfile?: { specialisation?: string };
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  color?: string;
  serviceType: string;
  durationMin: number;
  bufferTimeMin?: number;
  price: number;
  currency: string;
  isActive: boolean;
  requiresConsent: boolean;
  maxCapacity: number;
  category: ServiceCategory;
  variants?: ServiceVariant[];
  contraindications?: Contraindication[];
  doctors?: ServiceDoctor[];
  createdAt: string;
}

export interface CreateServiceDto {
  name: string;
  description?: string;
  color?: string;
  serviceType: string;
  categoryId: string;
  durationMin: number;
  bufferTimeMin?: number;
  price: number;
  currency?: string;
  isActive?: boolean;
  requiresConsent?: boolean;
  maxCapacity?: number;
}

export interface CreateCategoryDto {
  name: string;
  color?: string;
}

export interface CreateVariantDto {
  name: string;
  durationMin: number;
  price: number;
  currency?: string;
}

export interface CreateContraindicationDto {
  description: string;
  isCritical: boolean;
}

const servicesFullApi = {
  // Services
  list: (params?: {
    categoryId?: string;
    serviceType?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get("/services", { params }),

  getById: (id: string) => api.get(`/services/${id}`),
  create: (dto: CreateServiceDto) => api.post("/services", dto),
  update: (id: string, dto: Partial<CreateServiceDto>) =>
    api.patch(`/services/${id}`, dto),
  delete: (id: string) => api.delete(`/services/${id}`),
  activate: (id: string) => api.patch(`/services/${id}/activate`),

  // Categories
  listCategories: () => api.get("/services/categories"),
  createCategory: (dto: CreateCategoryDto) =>
    api.post("/services/categories", dto),
  updateCategory: (id: string, dto: Partial<CreateCategoryDto>) =>
    api.patch(`/services/categories/${id}`, dto),
  deleteCategory: (id: string) => api.delete(`/services/categories/${id}`),

  // Variants
  listVariants: (serviceId: string) =>
    api.get(`/services/${serviceId}/variants`),
  createVariant: (serviceId: string, dto: CreateVariantDto) =>
    api.post(`/services/${serviceId}/variants`, dto),
  updateVariant: (
    serviceId: string,
    variantId: string,
    dto: Partial<CreateVariantDto>,
  ) => api.patch(`/services/${serviceId}/variants/${variantId}`, dto),
  deleteVariant: (serviceId: string, variantId: string) =>
    api.delete(`/services/${serviceId}/variants/${variantId}`),

  // Contraindications
  listContraindications: (serviceId: string) =>
    api.get(`/services/${serviceId}/contraindications`),
  createContraindication: (serviceId: string, dto: CreateContraindicationDto) =>
    api.post(`/services/${serviceId}/contraindications`, dto),
  deleteContraindication: (serviceId: string, id: string) =>
    api.delete(`/services/${serviceId}/contraindications/${id}`),

  // Doctor assignments
  getDoctors: (serviceId: string) => api.get(`/services/${serviceId}/doctors`),
  assignDoctor: (serviceId: string, userId: string) =>
    api.post(`/services/${serviceId}/doctors`, { userId }),
  removeDoctor: (serviceId: string, userId: string) =>
    api.delete(`/services/${serviceId}/doctors/${userId}`),

  // Availability
  getAvailability: (
    serviceId: string,
    params: { month: number; year: number; doctorId?: string },
  ) => api.get(`/services/${serviceId}/availability`, { params }),
};

export default servicesFullApi;
