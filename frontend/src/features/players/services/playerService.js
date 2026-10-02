import apiClient from "../../../services/apiClient";

export const getPlayers = async () => {
  const response = await apiClient.get("/players");
  return response.data?.data || [];
};

export const getPlayerById = async (playerId) => {
  const response = await apiClient.get(`/players/${playerId}`);
  return response.data?.data || null;
};

// The API exposes TeamPlayer records publicly, but does not yet expose a
// player-scoped membership endpoint. Keep that API detail inside this service.
export const getPlayerMemberships = async (playerId) => {
  const response = await apiClient.get("/team-players");
  const memberships = response.data?.data || [];

  return memberships.filter(
    (membership) => membership.player_id === Number(playerId)
  );
};

export const getPlayerDirectoryData = async () => {
  const [playersResponse, membershipsResponse] = await Promise.all([
    apiClient.get("/players"),
    apiClient.get("/team-players"),
  ]);

  return {
    players: playersResponse.data?.data || [],
    memberships: membershipsResponse.data?.data || [],
  };
};
