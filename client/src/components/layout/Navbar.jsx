// client/src/components/layout/Navbar.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Trigger auth change event for same-tab updates
    window.dispatchEvent(new Event("authChanged"));
    navigate("/", { replace: true });
  };

  const roleLabel = user?.role?.toUpperCase();
  return (
    <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
      <div className="flex flex-col">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-gray-900">
            Opportunity Portal
          </h1>

          {user?.role && (
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold tracking-wide ${
                user.role === "admin"
                  ? "bg-purple-50 text-purple-700 border-purple-200"
                  : "bg-blue-50 text-blue-700 border-blue-200"
              }`}
            >
              {roleLabel}
            </span>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-1">
          {user?.email ? (
            <>
              Signed in as <span className="font-medium">{user.email}</span>
            </>
          ) : (
            "Not logged in"
          )}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition text-sm font-medium"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
