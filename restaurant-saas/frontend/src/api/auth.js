import api from "./client";

export const requestOtp = (identifier, purpose) =>
  api.post("/auth/otp/request", { identifier, purpose }).then((r) => r.data);

export const login = (identifier, password, otp_code) =>
  api.post("/auth/login", { identifier, password, otp_code }).then((r) => r.data);

export const registerCustomer = (payload) =>
  api.post("/auth/register", payload).then((r) => r.data);
