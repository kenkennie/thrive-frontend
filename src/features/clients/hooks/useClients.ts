"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import clientsApi, {
  type ListClientsQuery,
  type CreateClientDto,
  type UpdateClientDto,
} from "@/lib/api/clients";

export const CLIENT_KEYS = {
  all: ["clients"] as const,
  list: (q: ListClientsQuery) => ["clients", "list", q] as const,
  detail: (id: string) => ["clients", "detail", id] as const,
  history: (id: string) => ["clients", "history", id] as const,
  intake: (id: string) => ["clients", "intake", id] as const,
  photos: (id: string) => ["clients", "photos", id] as const,
  invoices: (id: string) => ["clients", "invoices", id] as const,
};

export function useClientsList(query: ListClientsQuery) {
  return useQuery({
    queryKey: CLIENT_KEYS.list(query),
    queryFn: () => clientsApi.list(query).then((r) => r.data),
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: CLIENT_KEYS.detail(id),
    queryFn: () => clientsApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useClientHistory(id: string) {
  return useQuery({
    queryKey: CLIENT_KEYS.history(id),
    queryFn: () => clientsApi.getTreatmentHistory(id).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useClientIntakeForms(id: string) {
  return useQuery({
    queryKey: CLIENT_KEYS.intake(id),
    queryFn: () => clientsApi.getIntakeForms(id).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useClientPhotos(id: string) {
  return useQuery({
    queryKey: CLIENT_KEYS.photos(id),
    queryFn: () => clientsApi.getPhotos(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useClientInvoices(id: string) {
  return useQuery({
    queryKey: CLIENT_KEYS.invoices(id),
    queryFn: () => clientsApi.getInvoices(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateClientDto) => clientsApi.create(dto),
    onSuccess: () => {
      toast.success("Client created");
      qc.invalidateQueries({ queryKey: CLIENT_KEYS.all });
    },
    onError: (err: any) =>
      toast.error(err?.message ?? "Failed to create client"),
  });
}

export function useUpdateClient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateClientDto) => clientsApi.update(id, dto),
    onSuccess: () => {
      toast.success("Client updated");
      qc.invalidateQueries({ queryKey: CLIENT_KEYS.detail(id) });
    },
    onError: (err: any) =>
      toast.error(err?.message ?? "Failed to update client"),
  });
}

export function useRecordPhotoConsent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (granted: boolean) =>
      clientsApi.recordPhotoConsent(id, granted),
    onSuccess: (_, granted) => {
      toast.success(
        granted ? "Photo consent recorded" : "Photo consent revoked",
      );
      qc.invalidateQueries({ queryKey: CLIENT_KEYS.detail(id) });
    },
    onError: (err: any) =>
      toast.error(err?.message ?? "Failed to update consent"),
  });
}
