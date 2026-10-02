import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getCurrentUser,
  loginUser,
} from "../features/auth/services/authService";
import { AUTH_SESSION_EXPIRED_EVENT } from "../services/apiClient";

const AuthContext = createContext(null);

const TOKEN_KEY = "hpl_token";
const USER_KEY = "hpl_user";

const readStorage = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const removeStoredSession = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // Storage can be unavailable in private browsing modes. The in-memory
    // session is still cleared below.
  }
};

const getStoredUser = () => {
  try {
    const storedUser = readStorage(USER_KEY);

    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    try {
      localStorage.removeItem(USER_KEY);
    } catch {
      // Ignore unavailable storage and treat the saved user as invalid.
    }
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);
  const [token, setToken] = useState(() =>
    readStorage(TOKEN_KEY)
  );

  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const clearSession = useCallback(() => {
    removeStoredSession();

    setToken(null);
    setUser(null);
  }, []);

  const saveSession = useCallback((authToken, authenticatedUser) => {
    try {
      localStorage.setItem(TOKEN_KEY, authToken);
      localStorage.setItem(
        USER_KEY,
        JSON.stringify(authenticatedUser)
      );
    } catch {
      // A session remains usable for this tab if persistent storage is blocked.
    }

    setToken(authToken);
    setUser(authenticatedUser);
  }, []);

  const login = useCallback(
    async (credentials) => {
      const response = await loginUser(credentials);

      const authToken = response?.data?.token;
      const authenticatedUser = response?.data?.user;

      if (!authToken || !authenticatedUser) {
        throw new Error("Invalid login response from server.");
      }

      saveSession(authToken, authenticatedUser);

      return authenticatedUser;
    },
    [saveSession]
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const storedToken = readStorage(TOKEN_KEY);

      if (!storedToken) {
        if (isMounted) {
          setIsAuthLoading(false);
        }

        return;
      }

      try {
        const response = await getCurrentUser();
        const currentUser = response?.data;

        if (!currentUser) {
          clearSession();
          return;
        }

        try {
          localStorage.setItem(
            USER_KEY,
            JSON.stringify(currentUser)
          );
        } catch {
          // Keeping the verified user in memory is enough for this session.
        }

        if (isMounted) {
          setToken(storedToken);
          setUser(currentUser);
        }
      } catch {
        clearSession();
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [clearSession]);

  useEffect(() => {
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, clearSession);

    return () => {
      window.removeEventListener(
        AUTH_SESSION_EXPIRED_EVENT,
        clearSession
      );
    };
  }, [clearSession]);

  const isAuthenticated = Boolean(token && user);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated,
      isAuthLoading,
      login,
      logout,
    }),
    [
      user,
      token,
      isAuthenticated,
      isAuthLoading,
      login,
      logout,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
