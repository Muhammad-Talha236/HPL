import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
const RefereeRoute=()=>{const {user,isAuthenticated,isAuthLoading}=useAuth();const location=useLocation();if(isAuthLoading)return <div className="min-h-screen bg-[#011427]"/>;if(!isAuthenticated)return <Navigate to="/login" replace state={{from:location}}/>;return user?.role==="REFEREE"?<Outlet/>:<Navigate to="/" replace/>}; export default RefereeRoute;
