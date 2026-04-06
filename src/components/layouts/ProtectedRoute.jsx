// =============================================================
// FILE: src/components/layouts/ProtectedRoute.jsx
// PURPOSE: Route guards. AdminRoute allows admin and admin+coach.
//          CoachRoute allows coach and admin+coach.
//          BothRoute allows any authenticated user.
//          All redirect to /auth if not authenticated.
//          Shows full-screen spinner while auth is loading.
// =============================================================

import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Spinner = () => (
  <div style={{
    minHeight: "100vh", display: "flex",
    alignItems: "center", justifyContent: "center",
  }}>
    <div className="spinner spinner-lg" />
  </div>
);

export const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/coach-dashboard" replace />;
  return children;
};

export const CoachRoute = ({ children }) => {
  const { isAuthenticated, isCoach, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (!isCoach) return <Navigate to="/admin-dashboard" replace />;
  return children;
};

export const BothRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return children;
};

export const PublicRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, isCoach, loading } = useAuth();
  if (loading) return <Spinner />;
  if (isAuthenticated) {
    if (isAdmin) return <Navigate to="/admin-dashboard" replace />;
    if (isCoach) return <Navigate to="/coach-dashboard" replace />;
  }
  return children;
};