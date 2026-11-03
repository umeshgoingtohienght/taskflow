import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <div className="center-screen"><div className="spinner" /></div>;
  return token ? children : <Navigate to="/login" replace />;
}
