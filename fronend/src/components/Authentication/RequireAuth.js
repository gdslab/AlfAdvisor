import { useLocation, Navigate, Outlet } from "react-router-dom";
import useAuth from "./hooks/useAuth";
import useToken from "./hooks/useToken";

const RequireAuth = () => {
    const token = useToken();
    const isAuthenticated = !!token;
    
  return (
    isAuthenticated ? <Outlet /> : <Navigate to="/auth/login" replace />
  )
}

export default RequireAuth;

