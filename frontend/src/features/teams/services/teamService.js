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
  const response = await apiClient.get(
    `/team-players/team/${teamId}`
  );

  return response.data?.data || [];
};

/* =========================================================
   ALL TEAM MATCHES
========================================================= */

export const getAllTeamMatches = async (teamId) => {
  const response = await apiClient.get("/matches", {
    params: {
      team_id: teamId,
      limit: 100,
    },
  });

  return response.data?.data?.matches || [];
};

/* =========================================================
   MATCH HELPER
========================================================= */

const getTeamMatches = async (
  teamId,
  status,
  limit
) => {
  const response = await apiClient.get("/matches", {
    params: {
      limit,
      status,
      team_id: teamId,
    },
  });

  return response.data?.data?.matches || [];
};

/* =========================================================
   RECENT RESULTS
========================================================= */

export const getTeamRecentResults = async (teamId) => {
  const matches = await getTeamMatches(
    teamId,
    "COMPLETED",
    50
  );

  return matches.slice(-3).reverse();
};

/* =========================================================
   UPCOMING
========================================================= */

export const getTeamUpcomingMatches = (teamId) =>
  getTeamMatches(
    teamId,
    "SCHEDULED",
    3
  );