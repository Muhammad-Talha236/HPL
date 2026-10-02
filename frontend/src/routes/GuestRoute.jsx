import { Navigate, Outlet } from "react-router-dom";

import useAuth from "../hooks/useAuth";

const GuestRoute = () => {
  const { isAuthenticated, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#011427]">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-[#FF553D]"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default GuestRoute;
