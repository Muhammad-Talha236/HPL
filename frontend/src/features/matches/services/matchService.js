import apiClient from "../../../services/apiClient";

export const getMatches = async ({ signal, ...params } = {}) => {
  const response = await apiClient.get("/matches", {
    params: { limit: 100, page: 1, ...params },
    signal,
  });
  return response.data?.data || { matches: [], pagination: {} };
};

export const getMatchById = async (matchId, signal) => {
  const response = await apiClient.get(`/matches/${matchId}`, { signal });
  return response.data?.data || null;
};

export const getCompetitionsForMatches = async () => {
  const response = await apiClient.get("/competitions");
  return response.data?.data || [];
};

export const getSeasonsForMatches = async () => {
  const response = await apiClient.get("/seasons");
  return response.data?.data || [];
};

export const getTeamsForMatches = async () => {
  const response = await apiClient.get("/teams");
  return response.data?.data || [];
};
