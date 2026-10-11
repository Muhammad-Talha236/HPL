
import apiClient from "../../../services/apiClient";

const unwrap = (response) => response.data?.data;

export const adminTeamDetailsService = {
  async getTeam(teamId, signal) {
    const response = await apiClient.get(
      `/admin/teams/${teamId}`,
      { signal }
    );
    return unwrap(response);
  },

  async getStats(teamId, signal) {
    const response = await apiClient.get(
      `/admin/teams/${teamId}/stats`,
      { signal }
    );
    return unwrap(response);
  },

  async getPlayers(teamId, filters = {}, signal) {
    const response = await apiClient.get(
      `/admin/teams/${teamId}/players`,
      {
        params: {
          page: filters.page ?? 1,
          limit: filters.limit ?? 10,
          status: filters.status ?? "ACTIVE",
          ...(filters.q ? { q: filters.q } : {}),
          ...(filters.position
            ? { position: filters.position }
            : {}),
        },
        signal,
      }
    );

    return {
      players: unwrap(response) ?? [],
      pagination: response.data?.pagination ?? null,
    };
  },

  async getHistory(teamId, signal) {
    const response = await apiClient.get(
      `/admin/teams/${teamId}/history`,
      { signal }
    );
    return unwrap(response) ?? [];
  },
};

export const getTeamDetailsError = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Unable to load team information.";
