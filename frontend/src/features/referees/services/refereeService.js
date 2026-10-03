import apiClient from "../../../services/apiClient";

const unwrap = (response) => response.data?.data;
export const getReferees = async (params = {}) => (await apiClient.get("/referees", { params })).data;
export const getReferee = async (id) => unwrap(await apiClient.get(`/referees/${id}`));
export const getRefereeMatches = async (id, params = {}) => (await apiClient.get(`/referees/${id}/matches`, { params })).data;
export const getRefereeRankings = async (params = {}) => (await apiClient.get("/referees/rankings", { params })).data;
export const getRefereeDashboard = async () => unwrap(await apiClient.get("/referees/me/dashboard"));
export const getMyAssignments = async (params = {}) => unwrap(await apiClient.get("/referees/me/matches", { params }));
export const getWorkspace = async (matchId) => unwrap(await apiClient.get(`/referees/me/matches/${matchId}`));
export const startAssignedMatch = async (matchId) => unwrap(await apiClient.post(`/matches/${matchId}/start`));
export const completeAssignedMatch = async (matchId) => unwrap(await apiClient.patch(`/matches/${matchId}/complete`));
export const addMatchEvent = async (data) => unwrap(await apiClient.post("/match-events", data));
