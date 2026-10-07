import apiClient from "../../../services/apiClient";

/* =========================================================
   PLAYER DIRECTORY
   Used by PlayersPage.jsx
========================================================= */

export const getPlayerDirectoryData = async () => {
  const response = await apiClient.get("/players");

  const data = response.data?.data;

  /*
   * Supports both:
   *
   * data: [...]
   *
   * OR
   *
   * data: {
   *   players: [...]
   * }
   */

  const players = Array.isArray(data)
    ? data
    : data?.players || [];
  const memberships = data?.memberships || players.flatMap(
    (player) => player.team_players || []
  );

  return {
    players: players.map(({ team_players: _teamPlayers, ...player }) => player),
    memberships,
  };
};

/* =========================================================
   GET SINGLE PLAYER
   Used by PlayerDetailsPage.jsx
========================================================= */

export const getPlayerById = async (playerId) => {
  const response = await apiClient.get(
    `/players/${playerId}`
  );

  return response.data?.data || null;
};