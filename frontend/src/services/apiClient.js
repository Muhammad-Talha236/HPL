import axios from "axios";

export const AUTH_SESSION_EXPIRED_EVENT = "hpl:session-expired";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

const getToken = () => {
  try {
    return localStorage.getItem("hpl_token");
  } catch {
    return null;
  }
};

const clearStoredSession = () => {
  try {
    localStorage.removeItem("hpl_token");
    localStorage.removeItem("hpl_user");
  } catch {
    // The React context will still clear the in-memory session.
  }
};

// Attach Authorization Token to outgoing requests
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Keep authentication state in sync when any authenticated request is rejected.
// Navigation is deliberately left to React routes: forcing a full-page redirect here
// makes login errors and in-flight requests difficult to handle predictably.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      clearStoredSession();
      window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  }
);

export default apiClient;
