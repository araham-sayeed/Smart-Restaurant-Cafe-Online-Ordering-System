import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../store/useAuth";

const isAdminRole = (role) => role === "admin" || role === "owner";

export default function AdminRoute({ children }) {
  const { token, user, fetchMe, logout } = useAuth();

  useEffect(() => {
    if (token && !user) {
      fetchMe().catch(() => logout());
    }
  }, [token, user, fetchMe, logout]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (user && !isAdminRole(user.role)) {
    const slug = user.restaurant_slug;
    return <Navigate to={slug ? `/r/${slug}` : "/menu"} replace />;
  }

  return children;
}
