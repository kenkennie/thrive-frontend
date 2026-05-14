import api from "./client";

export interface WorkingDay {
  id?: string;
  dayOfWeek: number; // 0=Sun … 6=Sat
  isWorking: boolean;
  startTime: string; // "HH:MM"
  endTime: string;
}

export interface BlockedSlot {
  id: string;
  date: string;
  isFullDay: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

const scheduleApi = {
  // Working schedule
  getSchedule: (userId: string) => api.get(`/staff/${userId}/schedule`),
  updateSchedule: (userId: string, days: WorkingDay[]) =>
    api.put(`/staff/${userId}/schedule`, { days }),

  // Blocked slots
  listBlocked: (userId: string, params?: any) =>
    api.get(`/staff/${userId}/blocked-slots`, { params }),
  addBlocked: (userId: string, dto: any) =>
    api.post(`/staff/${userId}/blocked-slots`, dto),
  removeBlocked: (userId: string, slotId: string) =>
    api.delete(`/staff/${userId}/blocked-slots/${slotId}`),
};

export default scheduleApi;
