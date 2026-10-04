import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function TeamOwnerRoute() {
  const { user, isAuthenticated, isAuthLoading } = useAuth();
  const location = useLocation();

  if (isAuthLoading) return <div className="min-h-screen bg-slate-100" role="status" aria-label="Checking access" />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  return user?.role === "TEAM_OWNER" ? <Outlet /> : <Navigate to="/" replace />;
}
