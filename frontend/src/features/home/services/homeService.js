import apiClient from "../../../services/apiClient";

const getMatches = async (params) => {
  const response = await apiClient.get("/matches", { params });
  return response.data?.data?.matches || [];
};

export const getLiveMatches = () =>
  getMatches({ status: "LIVE", limit: 1 });

export const getRecentResults = () =>
  getMatches({ status: "COMPLETED", limit: 100 });

export const getUpcomingMatches = () =>
  getMatches({ status: "SCHEDULED", limit: 4 });

export const getCompetitions = async () => {
  const response = await apiClient.get("/competitions");
  return response.data?.data || [];
};

export const getStandings = async (competitionId) => {
  const response = await apiClient.get(
    `/standings/competition/${competitionId}`
  );
  return response.data?.data || [];
};

export const getLatestNews = async () => {
  const response = await apiClient.get("/news");
  return response.data?.data || [];
};
