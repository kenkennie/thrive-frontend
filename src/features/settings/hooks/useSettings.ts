"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import settingsApi from "@/lib/api/settings";
import { extractArray, extractItem } from "@/lib/api/response";
import { useSettingsStore } from "@/stores/settings.store";

export const SETTINGS_KEYS = {
  all: ["settings"] as const,
  exchangeRates: ["settings", "exchange-rates"] as const,
  genders: ["settings", "genders"] as const,
  skinTypes: ["settings", "skin-types"] as const,
  statuses: ["settings", "appointment-statuses"] as const,
  sources: ["settings", "booking-sources"] as const,
};

export function useClinicSettings() {
  return useQuery({
    queryKey: SETTINGS_KEYS.all,
    queryFn: () => settingsApi.get(),
    select: (res) => extractItem<any>(res),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  const loadSettings = useSettingsStore((s) => s.load);
  return useMutation({
    mutationFn: settingsApi.update,
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: SETTINGS_KEYS.all });
      loadSettings(); // refresh feature flags in store
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to save settings"),
  });
}

export function useExchangeRates() {
  return useQuery({
    queryKey: SETTINGS_KEYS.exchangeRates,
    queryFn: () => settingsApi.getExchangeRates(),
    select: (res) => extractArray(res),
  });
}

export function useCreateExchangeRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.createExchangeRate,
    onSuccess: () => {
      toast.success("Exchange rate set");
      qc.invalidateQueries({ queryKey: SETTINGS_KEYS.exchangeRates });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to set rate"),
  });
}

export function useLookups(type: keyof typeof SETTINGS_KEYS) {
  const keyMap: Record<string, () => Promise<any>> = {
    genders: settingsApi.getGenders,
    skinTypes: settingsApi.getSkinTypes,
    statuses: settingsApi.getAppointmentStatuses,
    sources: settingsApi.getBookingSources,
  };
  return useQuery({
    queryKey: SETTINGS_KEYS[type] as readonly string[],
    queryFn: keyMap[type as string] ?? settingsApi.getGenders,
    select: (res) => extractArray(res),
  });
}

export function useLookupMutations(type: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["settings"] });

  const create = useMutation({
    mutationFn: (dto: any) => settingsApi.createLookup(type, dto),
    onSuccess: () => {
      toast.success("Item added");
      invalidate();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const update = useMutation({
    mutationFn: ({ id, ...dto }: any) =>
      settingsApi.updateLookup(type, id, dto),
    onSuccess: () => {
      toast.success("Item updated");
      invalidate();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => settingsApi.deleteLookup(type, id),
    onSuccess: () => {
      toast.success("Item removed");
      invalidate();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  return { create, update, remove };
}
