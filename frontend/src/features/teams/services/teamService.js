import apiClient from "../../../services/apiClient";

export const getTeams = async () => {
  const response = await apiClient.get("/teams");
  return response.data?.data || [];
};

export const getTeamById = async (teamId) => {
  const response = await apiClient.get(`/teams/${teamId}`);
  return response.data?.data || null;
};

export const getTeamSquad = async (teamId) => {
  const response = await apiClient.get(`/team-players/team/${teamId}`);
  return response.data?.data || [];
};

const getTeamMatches = async (teamId, status, limit) => {
  const response = await apiClient.get("/matches", {
    params: { limit, status, team_id: teamId },
  });
  return response.data?.data?.matches || [];
};

export const getTeamRecentResults = async (teamId) => {
  const matches = await getTeamMatches(teamId, "COMPLETED", 50);
  return matches.slice(-3).reverse();
};

export const getTeamUpcomingMatches = (teamId) =>
  getTeamMatches(teamId, "SCHEDULED", 3);
