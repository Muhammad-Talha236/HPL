import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function ClubOwnerRoute() {
  const { user, isAuthenticated, isAuthLoading } = useAuth();
  const location = useLocation();
  if (isAuthLoading) return <div className="min-h-screen bg-[#061525]" />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  return user?.role === "CLUB_OWNER" ? <Outlet /> : <Navigate to="/" replace />;
}
