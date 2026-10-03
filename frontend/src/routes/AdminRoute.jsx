import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
const AdminRoute = () => { const { user, isAuthenticated, isAuthLoading } = useAuth(); const location = useLocation(); if (isAuthLoading) return <div className="min-h-screen bg-[#011427]" />; if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />; return user?.role === "SUPER_ADMIN" ? <Outlet /> : <Navigate to="/" replace />; };
export default AdminRoute;
