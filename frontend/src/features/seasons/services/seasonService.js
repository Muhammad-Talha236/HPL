import apiClient from "../../../services/apiClient";

export const getSeasons = async () => {
  const response = await apiClient.get("/seasons");
  return response.data?.data || [];
};

export const getSeasonById = async (seasonId) => {
  const response = await apiClient.get(`/seasons/${seasonId}`);
  return response.data?.data || null;
};

export const getSeasonCompetitions = async (seasonId) => {
  const response = await apiClient.get("/competitions");
  const competitions = response.data?.data || [];

  return competitions.filter(
    (competition) => competition.season_id === Number(seasonId)
  );
};
