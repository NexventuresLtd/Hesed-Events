import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { state, dispatch } = useApp();

  useEffect(() => {
    // Check for stored user on component mount
    const accessToken = localStorage.getItem("access_token");
    const storedUser = localStorage.getItem("user");

    if (accessToken && storedUser && !state.user) {
      try {
        const user = JSON.parse(storedUser);
        dispatch({ type: "SET_USER", payload: user });
      } catch (error) {
        // Invalid stored data, clear it
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
      }
    }
  }, [dispatch, state.user]);

  // If no token, redirect to login
  const accessToken = localStorage.getItem("access_token");
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  // If token exists but user is not loaded yet, show loading
  if (!state.user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
