import api from "./client";

export const getKitchenOrders = (includeCompleted = false) =>
  api.get(`/kitchen/orders${includeCompleted ? "?include_completed=true" : ""}`).then((r) => r.data);

export const updateOrderStatus = (orderId, status) =>
  api.patch(`/kitchen/orders/${orderId}/status`, { status }).then((r) => r.data);

export const getKitchenStreamUrl = () => {
  const baseURL = api.defaults.baseURL || "http://localhost:8000";
  const token = localStorage.getItem("token") || "";
  // Note: EventSource passes token via query param or headers if custom, or browser handles cookies/query
  return `${baseURL}/kitchen/stream?token=${encodeURIComponent(token)}`;
};
