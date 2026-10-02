import apiClient from "../../../services/apiClient";

const AUTH_ENDPOINTS = {
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  ME: "/auth/me",
};

export const loginUser = async (credentials) => {
  const response = await apiClient.post(
    AUTH_ENDPOINTS.LOGIN,
    credentials
  );

  return response.data;
};

export const registerUser = async (userData) => {
  const response = await apiClient.post(
    AUTH_ENDPOINTS.REGISTER,
    userData
  );

  return response.data;
};

export const getCurrentUser = async () => {
  const response = await apiClient.get(
    AUTH_ENDPOINTS.ME
  );

  return response.data;
};