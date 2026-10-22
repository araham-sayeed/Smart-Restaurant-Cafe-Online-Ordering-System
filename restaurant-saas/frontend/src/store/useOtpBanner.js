import { create } from "zustand";

export const useOtpBanner = create((set) => ({
  code: null,
  message: null,
  show: (code, message = "Your verification code") => set({ code, message }),
  clear: () => set({ code: null, message: null }),
}));
