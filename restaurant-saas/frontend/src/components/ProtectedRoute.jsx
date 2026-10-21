import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../store/useAuth";

export default function ProtectedRoute({ children }) {
  const { token, user, fetchMe, logout } = useAuth();

  useEffect(() => {
    if (token && !user) {
      fetchMe().catch(() => logout());
    }
  }, [token, user, fetchMe, logout]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
