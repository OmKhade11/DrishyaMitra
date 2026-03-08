import { Navigate } from "react-router-dom";
import { useAuth } from "../auth-context";

export function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-sm text-gray-500">Checking session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}
