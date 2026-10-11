
import apiClient from "../../../services/apiClient";

const unwrap = (response) => response.data?.data;

export const adminUsersService = {
  async list(params = {}, signal) {
    const response = await apiClient.get("/users", {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        sort: params.sort ?? "newest",
        ...(params.q ? { q: params.q } : {}),
        ...(params.role ? { role: params.role } : {}),
        ...(params.status ? { status: params.status } : {}),
      },
      signal,
    });

    return {
      users: unwrap(response) ?? [],
      pagination: response.data?.pagination ?? null,
    };
  },

  async stats(signal) {
    const response = await apiClient.get(
      "/admin/users/stats",
      { signal }
    );
    return unwrap(response);
  },

  async getById(userId, signal) {
    const response = await apiClient.get(
      `/admin/users/${userId}`,
      { signal }
    );
    return unwrap(response);
  },

  async createNormalUser(payload) {
    const response = await apiClient.post(
      "/auth/register",
      payload
    );
    return response.data;
  },

  async updateProfile(userId, payload) {
    const response = await apiClient.patch(
      `/users/${userId}`,
      payload
    );
    return unwrap(response);
  },

  async changeRole(userId, role) {
    const response = await apiClient.patch(
      `/users/${userId}/role`,
      { role }
    );
    return unwrap(response);
  },

  async changeStatus(userId, action) {
    const allowed = ["activate", "deactivate", "block"];

    if (!allowed.includes(action)) {
      throw new Error("Unsupported account action");
    }

    const response = await apiClient.patch(
      `/users/${userId}/${action}`
    );
    return unwrap(response);
  },
};

export function getAdminUsersError(error) {
  const data = error?.response?.data;

  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors
      .map((entry) => entry.msg || entry.message)
      .filter(Boolean)
      .join(", ");
  }

  return (
    data?.message ||
    error?.message ||
    "Unable to complete this action."
  );
}
