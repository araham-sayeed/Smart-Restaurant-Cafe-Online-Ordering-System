import { create } from "zustand";
import api from "../api/client";

export const useAuth = create((set) => ({
  token: localStorage.getItem("token"),
  user: null,

  setToken: (token) => {
    localStorage.setItem("token", token);
    set({ token });
  },

  fetchMe: async () => {
    const { data } = await api.get("/auth/me");
    set({ user: data });
    return data;
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ token: null, user: null });
  },
}));

export default useAuth;