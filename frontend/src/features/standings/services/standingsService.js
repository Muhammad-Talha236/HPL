import apiClient from "../../../services/apiClient";

export const getStandingsCompetitions = async () => {
  const response = await apiClient.get("/competitions");
  return response.data?.data || [];
};

export const getCompetitionStandings = async (competitionId) => {
  const response = await apiClient.get(`/standings/competition/${competitionId}`);
  return response.data?.data || [];
};
