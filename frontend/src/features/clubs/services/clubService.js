import apiClient from "../../../services/apiClient";

export const getClubs = async (params) => {
  const response = await apiClient.get("/clubs", { params });
  return response.data;
};

export const getClubById = async (clubId) => {
  const response = await apiClient.get(`/clubs/${clubId}`);
  return response.data?.data || null;
};
