import apiClient from "../../../services/apiClient";

export const getMatches = async (params = {}) => {
  const response = await apiClient.get("/matches", {
    params: { limit: 100, page: 1, ...params },
  });
  return response.data?.data || { matches: [], pagination: {} };
};

export const getMatchById = async (matchId) => {
  const response = await apiClient.get(`/matches/${matchId}`);
  return response.data?.data || null;
};

export const getCompetitionsForMatches = async () => {
  const response = await apiClient.get("/competitions");
  return response.data?.data || [];
};
