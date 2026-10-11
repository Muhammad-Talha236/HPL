
import apiClient from "../../../services/apiClient";

const unwrap = (response) => response.data?.data;

export const adminTeamsService = {
  async list(filters = {}, signal) {
    const response = await apiClient.get("/admin/teams", {
      params: {
        page: filters.page ?? 1,
        limit: filters.limit ?? 10,
        ...(filters.q ? { q: filters.q } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.gender ? { gender: filters.gender } : {}),
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.club_id ? { club_id: filters.club_id } : {}),
      },
      signal,
    });

    return {
      teams: unwrap(response) || [],
      pagination: response.data?.pagination || null,
    };
  },

  async stats(signal) {
    const response = await apiClient.get(
      "/admin/teams/stats",
      { signal }
    );
    return unwrap(response);
  },

  async filterOptions(signal) {
    const response = await apiClient.get(
      "/admin/teams/filter-options",
      { signal }
    );
    return unwrap(response);
  },

  async getById(teamId, signal) {
    const response = await apiClient.get(
      `/admin/teams/${teamId}`,
      { signal }
    );
    return unwrap(response);
  },

  async changeStatus(teamId, action) {
    if (!["activate", "deactivate"].includes(action)) {
      throw new Error("Invalid team status action");
    }

    const response = await apiClient.patch(
      `/teams/${teamId}/${action}`
    );

    return unwrap(response);
  },
};

export const getAdminTeamsError = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Unable to complete the request.";
