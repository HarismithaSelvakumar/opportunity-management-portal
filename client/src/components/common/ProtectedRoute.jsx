// client/src/components/common/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import AccessDenied from "../../pages/AccessDenied";

export default function ProtectedRoute({ allowedRoles }) {
  const { user, token, loading } = useAuth();

  // Still loading auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // If not logged in
  if (!token || !user) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/" replace />;
  }

  // Role check - show 403 Access Denied page
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <AccessDenied />;
  }

  return <Outlet />;
}
