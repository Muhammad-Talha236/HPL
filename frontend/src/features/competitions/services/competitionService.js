import apiClient from "../../../services/apiClient";

export const getCompetitions = async () => {
  const response = await apiClient.get("/competitions");
  return response.data?.data || [];
};

export const getCompetitionById = async (competitionId) => {
  const response = await apiClient.get(`/competitions/${competitionId}`);
  return response.data?.data || null;
};

export const getCompetitionStandings = async (competitionId) => {
  const response = await apiClient.get(`/standings/competition/${competitionId}`);
  return response.data?.data || [];
};

const getCompetitionMatches = async (competitionId, params) => {
  const response = await apiClient.get("/matches", {
    params: { competition_id: competitionId, ...params },
  });
  return response.data?.data || { matches: [], pagination: {} };
};

// The public API orders matches chronologically. Fetch only the final page of
// completed matches so the preview remains genuinely recent without loading all.
export const getCompetitionRecentResults = async (competitionId) => {
  const firstPage = await getCompetitionMatches(competitionId, {
    status: "COMPLETED",
    limit: 3,
    page: 1,
  });

  if ((firstPage.pagination?.total_pages || 1) <= 1) {
    return [...(firstPage.matches || [])].reverse();
  }

  const lastPage = await getCompetitionMatches(competitionId, {
    status: "COMPLETED",
    limit: 3,
    page: firstPage.pagination.total_pages,
  });

  return [...(lastPage.matches || [])].reverse();
};

export const getCompetitionUpcomingMatches = async (competitionId) => {
  const response = await getCompetitionMatches(competitionId, {
    status: "SCHEDULED",
    limit: 3,
    page: 1,
  });
  return response.matches || [];
};
