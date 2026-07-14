import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SplashScreen from "./SplashScreen";

export default function ProtectedRoute({ children }) {
  const { user, initializing } = useAuth();

  if (initializing) return <SplashScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
