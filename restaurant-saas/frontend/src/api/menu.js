import api from "./client";

export const getAdminMenu = () => api.get("/admin/menu/categories").then(r => r.data);
export const createCategory = (d) => api.post("/admin/menu/categories", d).then(r => r.data);
export const updateCategory = (id, d) => api.put(`/admin/menu/categories/${id}`, d).then(r => r.data);
export const deleteCategory = (id) => api.delete(`/admin/menu/categories/${id}`);

export const createItem = (d) => api.post("/admin/menu/items", d).then(r => r.data);
export const updateItem = (id, d) => api.put(`/admin/menu/items/${id}`, d).then(r => r.data);
export const setAvailability = (id, is_available) =>
    api.patch(`/admin/menu/items/${id}/availability`, { is_available }).then(r => r.data);
export const deleteItem = (id) => api.delete(`/admin/menu/items/${id}`);

export const createGroup = (itemId, d) => api.post(`/admin/menu/items/${itemId}/addon-groups`, d).then(r => r.data);
export const deleteGroup = (id) => api.delete(`/admin/menu/addon-groups/${id}`);
export const createOption = (groupId, d) => api.post(`/admin/menu/addon-groups/${groupId}/options`, d).then(r => r.data);
export const deleteOption = (id) => api.delete(`/admin/menu/addon-options/${id}`);

export const getPublicMenu = (slug) => api.get(slug ? `/public/${slug}/menu` : "/public/menu").then(r => r.data);