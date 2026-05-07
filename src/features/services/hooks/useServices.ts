"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import servicesFullApi from "@/lib/api/services-all";
import { extractArray, extractItem } from "@/lib/api/response";

export const SVC_KEYS = {
  all: ["services"] as const,
  list: (q: any) => ["services", "list", q] as const,
  detail: (id: string) => ["services", "detail", id] as const,
  categories: ["services", "categories"] as const,
  variants: (id: string) => ["services", "variants", id] as const,
  contras: (id: string) => ["services", "contraindications", id] as const,
  doctors: (id: string) => ["services", "doctors", id] as const,
  avail: (id: string, month: number, year: number, doctorId?: string) =>
    ["services", "availability", id, month, year, doctorId] as const,
};

export function useServicesList(query?: any) {
  return useQuery({
    queryKey: SVC_KEYS.list(query),
    queryFn: () => servicesFullApi.list(query),
    select: (res) => ({
      data: extractArray(res),
      meta: (res as any)?.data?.meta ?? null,
    }),
  });
}

export function useService(id: string) {
  return useQuery({
    queryKey: SVC_KEYS.detail(id),
    queryFn: () => servicesFullApi.getById(id),
    enabled: !!id,
    select: (res) => extractItem<any>(res),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: SVC_KEYS.categories,
    queryFn: () => servicesFullApi.listCategories(),
    select: (res) => extractArray(res),
  });
}

export function useServiceVariants(serviceId: string) {
  return useQuery({
    queryKey: SVC_KEYS.variants(serviceId),
    queryFn: () => servicesFullApi.listVariants(serviceId),
    enabled: !!serviceId,
    select: (res) => extractArray(res),
  });
}

export function useContraindications(serviceId: string) {
  return useQuery({
    queryKey: SVC_KEYS.contras(serviceId),
    queryFn: () => servicesFullApi.listContraindications(serviceId),
    enabled: !!serviceId,
    select: (res) => extractArray(res),
  });
}

export function useServiceDoctors(serviceId: string) {
  return useQuery({
    queryKey: SVC_KEYS.doctors(serviceId),
    queryFn: () => servicesFullApi.getDoctors(serviceId),
    enabled: !!serviceId,
    select: (res) => extractArray(res),
  });
}

export function useServiceAvailability(
  serviceId: string,
  month: number,
  year: number,
  doctorId?: string,
) {
  return useQuery({
    queryKey: SVC_KEYS.avail(serviceId, month, year, doctorId),
    queryFn: () =>
      servicesFullApi.getAvailability(serviceId, { month, year, doctorId }),
    enabled: !!serviceId,
    select: (res) => extractArray(res),
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

function inv(qc: any, keys: any[]) {
  keys.forEach((k) => qc.invalidateQueries({ queryKey: k }));
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: servicesFullApi.create,
    onSuccess: () => {
      toast.success("Service created");
      inv(qc, [SVC_KEYS.all]);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useUpdateService(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => servicesFullApi.update(id, dto),
    onSuccess: () => {
      toast.success("Service updated");
      inv(qc, [SVC_KEYS.all, SVC_KEYS.detail(id)]);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => servicesFullApi.delete(id),
    onSuccess: () => {
      toast.success("Service deleted");
      inv(qc, [SVC_KEYS.all]);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: servicesFullApi.createCategory,
    onSuccess: () => {
      toast.success("Category created");
      inv(qc, [SVC_KEYS.categories]);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: any) =>
      servicesFullApi.updateCategory(id, dto),
    onSuccess: () => {
      toast.success("Category updated");
      inv(qc, [SVC_KEYS.categories]);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => servicesFullApi.deleteCategory(id),
    onSuccess: () => {
      toast.success("Category deleted");
      inv(qc, [SVC_KEYS.categories]);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useCreateVariant(serviceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => servicesFullApi.createVariant(serviceId, dto),
    onSuccess: () => {
      toast.success("Variant added");
      inv(qc, [SVC_KEYS.variants(serviceId)]);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useDeleteVariant(serviceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (variantId: string) =>
      servicesFullApi.deleteVariant(serviceId, variantId),
    onSuccess: () => {
      toast.success("Variant removed");
      inv(qc, [SVC_KEYS.variants(serviceId)]);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useCreateContraindication(serviceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) =>
      servicesFullApi.createContraindication(serviceId, dto),
    onSuccess: () => {
      toast.success("Contraindication added");
      inv(qc, [SVC_KEYS.contras(serviceId)]);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useDeleteContraindication(serviceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      servicesFullApi.deleteContraindication(serviceId, id),
    onSuccess: () => {
      toast.success("Removed");
      inv(qc, [SVC_KEYS.contras(serviceId)]);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useAssignDoctor(serviceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      servicesFullApi.assignDoctor(serviceId, userId),
    onSuccess: () => {
      toast.success("Doctor assigned");
      inv(qc, [SVC_KEYS.doctors(serviceId)]);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}

export function useRemoveDoctor(serviceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      servicesFullApi.removeDoctor(serviceId, userId),
    onSuccess: () => {
      toast.success("Doctor removed");
      inv(qc, [SVC_KEYS.doctors(serviceId)]);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
}
