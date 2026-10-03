import apiClient from "../../../services/apiClient";

export const getTeamRankings = async (gender) => {
  const response = await apiClient.get("/rankings", { params: { gender } });
  return response.data?.data || { gender, rankings: [] };
};
