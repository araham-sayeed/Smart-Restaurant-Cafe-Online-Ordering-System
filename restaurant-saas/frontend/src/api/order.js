import api from "./client";

export const createOrder = (slug, payload) =>
  api
    .post(slug ? `/public/${slug}/orders` : "/public/orders", payload)
    .then((r) => r.data);

export const getOrder = (slug, publicId) =>
  api
    .get(slug ? `/public/${slug}/orders/${publicId}` : `/public/orders/${publicId}`)
    .then((r) => r.data);