import apiClient from "../../../services/apiClient";

export const getIndependentTeamVenues = async (signal) => {
  const response = await apiClient.get("/venues", { signal });
  return (response.data?.data || []).filter((venue) => venue.status === "ACTIVE");
};

export const registerIndependentTeam = async (payload) => {
  const response = await apiClient.post("/teams/independent", payload);
  return response.data;
};
