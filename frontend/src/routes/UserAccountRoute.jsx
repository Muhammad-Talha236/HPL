import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const destinationForRole = (role) => ({ TEAM_OWNER: "/team", CLUB_OWNER: "/club", SUPER_ADMIN: "/admin", REFEREE: "/referee/dashboard" }[role] || "/");

export default function UserAccountRoute() {
  const { user, isAuthenticated, isAuthLoading } = useAuth();
  const location = useLocation();
  if (isAuthLoading) return <div className="min-h-screen bg-[#011427]" role="status" aria-label="Checking account access" />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  return user?.role === "USER" ? <Outlet /> : <Navigate to={destinationForRole(user?.role)} replace />;
}
