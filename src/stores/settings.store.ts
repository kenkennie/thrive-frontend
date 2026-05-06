import { create } from "zustand";
import api from "@/lib/api/client";

interface ClinicSettings {
  clinicName: string;
  logoUrl: string | null;
  currency: string;
  vatRate: number | null;
  enableDashboard: boolean;
  enableAppointments: boolean;
  enableServices: boolean;
  enableClients: boolean;
  enableClinical: boolean;
  enablePayments: boolean;
  enableStaff: boolean;
  enableReports: boolean;
  enableInvoices: boolean;
  enableNotifications: boolean;
  enableSettings: boolean;
  enableTreatmentPlans: boolean;
}

interface SettingsState {
  settings: ClinicSettings | null;
  isLoaded: boolean;

  load: () => Promise<void>;
  isEnabled: (feature: keyof ClinicSettings) => boolean;
  clear: () => void;
}

const DEFAULTS: ClinicSettings = {
  clinicName: "Thrive Aesthetics Kenya",
  logoUrl: null,
  currency: "KES",
  vatRate: 16,
  enableDashboard: true,
  enableAppointments: true,
  enableServices: true,
  enableClients: true,
  enableClinical: true,
  enablePayments: true,
  enableStaff: true,
  enableReports: true,
  enableInvoices: true,
  enableNotifications: true,
  enableSettings: true,
  enableTreatmentPlans: true,
};

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  settings: null,
  isLoaded: false,

  load: async () => {
    try {
      const { data } = await api.get<{ data: ClinicSettings }>("/settings");
      set({ settings: data.data ?? DEFAULTS, isLoaded: true });
    } catch {
      set({ settings: DEFAULTS, isLoaded: true });
    }
  },

  isEnabled: (feature) => {
    const s = get().settings;
    if (!s) return true;
    return Boolean(s[feature]);
  },

  clear: () => set({ settings: null, isLoaded: false }),
}));

export const useFeatureEnabled = (feature: keyof ClinicSettings) =>
  useSettingsStore((s) => s.isEnabled(feature));

export const useClinicName = () =>
  useSettingsStore((s) => s.settings?.clinicName ?? "Thrive Aesthetics");
