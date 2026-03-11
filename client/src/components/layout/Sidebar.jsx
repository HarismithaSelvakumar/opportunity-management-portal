import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";

const linkClass = "block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700";
const activeClass =
  "block px-4 py-2 rounded-lg bg-blue-100 text-blue-700 font-semibold";

function SidebarItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => (isActive ? activeClass : linkClass)}
    >
      {children}
    </NavLink>
  );
}

export default function Sidebar() {
  const { user } = useAuth();
  const role = user?.role || "guest";

  return (
    <aside className="w-64 bg-white shadow-md min-h-screen p-4">
      <h2 className="text-xl font-bold text-gray-800 mb-6">
        Opportunity Portal
      </h2>

      <nav className="space-y-2">
        <SidebarItem to="/dashboard">Dashboard</SidebarItem>
        <SidebarItem to="/opportunities">Opportunities</SidebarItem>

        {/* USER */}
        {role === "user" && (
          <SidebarItem to="/applications">My Applications</SidebarItem>
        )}

        {/* CONTRIBUTOR + ADMIN */}
        {(role === "contributor" || role === "admin") && (
          <>
            <SidebarItem to="/submissions">My Submissions</SidebarItem>
            <SidebarItem to="/submit">
              {role === "admin" ? "Add Opportunity" : "Submit Opportunity"}
            </SidebarItem>
            <SidebarItem to="/contributor-analytics">Analytics</SidebarItem>
          </>
        )}

        {/* ADMIN ONLY */}
        {role === "admin" && (
          <SidebarItem to="/moderation">Moderation</SidebarItem>
        )}

        <SidebarItem to="/calendar">Calendar</SidebarItem>
      </nav>

      <div className="mt-8 text-sm text-gray-500">
        Logged in as: <span className="font-medium">{role}</span>
      </div>
    </aside>
  );
}
