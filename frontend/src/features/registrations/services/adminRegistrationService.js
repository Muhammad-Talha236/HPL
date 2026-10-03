import apiClient from "../../../services/apiClient";
export const getAdminRegistrations = async (params = {}) => (await apiClient.get("/registrations", { params })).data;
export const getAdminRegistration = async (id) => (await apiClient.get(`/registrations/admin/${id}`)).data?.data;
export const reviewRegistration = async (id, action, remarks) => (await apiClient.patch(`/registrations/${id}/review`, { action, remarks })).data?.data;
export const reviewPayment = async (id, action) => (await apiClient.patch(`/payments/${id}/review`, { action })).data?.data;
