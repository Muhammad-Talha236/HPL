import apiClient from "../../../services/apiClient";

const AUTH_ENDPOINTS = {
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  ME: "/auth/me",
  PASSWORD: "/auth/me/password",
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

export const updateCurrentUser = async (profile) => {
  const response = await apiClient.patch(AUTH_ENDPOINTS.ME, profile);
  return response.data;
};

export const changeCurrentUserPassword = async (passwords) => {
  const response = await apiClient.patch(AUTH_ENDPOINTS.PASSWORD, passwords);
  return response.data;
};

export const resendEmailVerification = async () => {
  const response = await apiClient.post("/auth/me/email-verification/resend");
  return response.data;
};
