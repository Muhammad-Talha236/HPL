import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import useAuth from "../hooks/useAuth";
import { getNotifications } from "../features/notifications/services/notificationService";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user, isAuthenticated, isAuthLoading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const synchronizeUnreadCount = useCallback((count) => {
    setUnreadCount(Number.isInteger(count) && count > 0 ? count : 0);
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated || user?.role !== "USER") {
      synchronizeUnreadCount(0);
      return 0;
    }

    try {
      const response = await getNotifications({ page: 1, limit: 1, status: "ALL" });
      const count = response.data?.unread_count || 0;
      synchronizeUnreadCount(count);
      return count;
    } catch {
      synchronizeUnreadCount(0);
      return 0;
    }
  }, [isAuthenticated, synchronizeUnreadCount, user?.role]);

  useEffect(() => {
    if (isAuthLoading) return undefined;
    const timer = setTimeout(() => { refreshUnreadCount(); }, 0);
    return () => clearTimeout(timer);
  }, [isAuthLoading, refreshUnreadCount]);

  const value = useMemo(() => ({ unreadCount, refreshUnreadCount, synchronizeUnreadCount }), [refreshUnreadCount, synchronizeUnreadCount, unreadCount]);
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export default NotificationContext;
