// =============================================================
// FILE: src/components/layouts/ProtectedRoute.jsx
// PURPOSE: Route guards. AdminRoute, CoachRoute, PublicRoute.
// =============================================================

import { Navigate } from "react-router-dom";
import { useAuth }  from "../../context/AuthContext";
import Spinner      from "../ui/Spinner";

export const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <Spinner full />;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (!isAdmin)         return <Navigate to="/coach-dashboard" replace />;
  return children;
};

export const CoachRoute = ({ children }) => {
  const { isAuthenticated, isCoach, loading } = useAuth();
  if (loading) return <Spinner full />;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (!isCoach)         return <Navigate to="/admin-dashboard" replace />;
  return children;
};

export const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <Spinner full />;
  if (isAuthenticated && user) {
    const dest = user.role === "coach" ? "/coach-dashboard" : "/admin-dashboard";
    return <Navigate to={dest} replace />;
  }
  return children;
};