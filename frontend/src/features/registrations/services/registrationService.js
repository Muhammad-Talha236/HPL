import apiClient from "../../../services/apiClient";
export const getMyRegistrations = async (params = {}) => (await apiClient.get("/registrations/my", { params })).data;
export const getRegistration = async (id) => (await apiClient.get(`/registrations/${id}`)).data?.data;
export const submitPayment = async (data) => (await apiClient.post("/payments", data)).data?.data;
export const updateSquad = async (id, player_ids) => (await apiClient.put(`/registrations/${id}/squad`, { player_ids })).data?.data;
