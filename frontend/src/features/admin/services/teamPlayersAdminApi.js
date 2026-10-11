import apiClient from "../../../services/apiClient";

const base = "/team-players";

export const teamPlayersAdminApi = {
  async getSquad(teamId) {
    const response = await apiClient.get(
      `${base}/team/${teamId}`
    );
    return response.data.data ?? [];
  },

  async addPlayer(teamId, data) {
    const response = await apiClient.post(base, {
      team_id: Number(teamId),
      player_id: Number(data.player_id),
      jersey_number: data.jersey_number
        ? Number(data.jersey_number)
        : null,
      joined_at: data.joined_at,
    });
    return response.data;
  },

  async updateJersey(membershipId, jerseyNumber) {
    const response = await apiClient.patch(
      `${base}/${membershipId}`,
      {
        jersey_number: jerseyNumber
          ? Number(jerseyNumber)
          : null,
      }
    );
    return response.data;
  },

  async removePlayer(membershipId) {
    const response = await apiClient.patch(
      `${base}/${membershipId}/remove`,
      {}
    );
    return response.data;
  },
};

export const getTeamPlayerError = (error) => {
  const data = error?.response?.data;

  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors
      .map((item) => item.msg || item.message)
      .filter(Boolean)
      .join(", ");
  }

  return (
    data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
};