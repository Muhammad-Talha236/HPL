
import apiClient from "../../../services/apiClient";

const unwrap = (response) => response.data?.data;

export const adminTeamCreateService = {
  async getOptions(signal) {
    const [clubsResponse, venuesResponse, ownersResponse] =
      await Promise.all([
        apiClient.get("/admin/clubs", {
          params: {
            page: 1,
            limit: 50,
            status: "ACTIVE",
          },
          signal,
        }),

        apiClient.get("/venues", { signal }),

        apiClient.get("/users", {
          params: {
            page: 1,
            limit: 50,
            status: "ACTIVE",
          },
          signal,
        }),
      ]);

    return {
      clubs: unwrap(clubsResponse) ?? [],
      venues: unwrap(venuesResponse) ?? [],
      owners: unwrap(ownersResponse) ?? [],
      pagination: {
        clubs: clubsResponse.data?.pagination ?? null,
        owners: ownersResponse.data?.pagination ?? null,
      },
    };
  },

  async create(form) {
    const payload = {
      name: form.name.trim(),
      club_id: Number(form.club_id),
      owner_id: Number(form.owner_id),
      home_venue_id: Number(form.home_venue_id),
      gender: form.gender,
      team_type: form.team_type.trim(),
    };

    const optionalFields = [
      "logo",
      "region",
      "district",
      "city",
      "description",
      "contact_email",
      "contact_phone",
    ];

    for (const key of optionalFields) {
      const value = form[key]?.trim();

      if (value) {
        payload[key] = value;
      }
    }

    const response = await apiClient.post("/teams", payload);

    return unwrap(response);
  },
};

export const getTeamCreateError = (error) => {
  const validationErrors = error?.response?.data?.errors;

  if (Array.isArray(validationErrors) && validationErrors.length) {
    return validationErrors
      .map((item) => item.msg || item.message)
      .filter(Boolean)
      .join(" ");
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    "Unable to create the team."
  );
};
