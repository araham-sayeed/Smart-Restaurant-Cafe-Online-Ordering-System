import api from "./client";

export const requestOtp = (identifier, purpose) =>
  api.post("/auth/otp/request", { identifier, purpose }).then((r) => r.data);

export const login = (identifier, password, otp_code) =>
  api.post("/auth/login", { identifier, password, otp_code }).then((r) => r.data);

export const registerCustomer = (payload) =>
  api.post("/auth/register", payload).then((r) => r.data);

export const requestCustomerOtp = (phone) =>
  api.post("/auth/customer/otp/request", { phone }).then((r) => r.data);

export const verifyCustomerOtp = (phone, otp_code, full_name = null) =>
  api.post("/auth/customer/otp/verify", { phone, otp_code, full_name }).then((r) => r.data);
