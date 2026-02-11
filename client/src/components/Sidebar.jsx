import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  PlusCircle,
  Calendar,
  LogOut,
} from "lucide-react";

export default function Sidebar() {
  const baseStyle =
    "flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition";

  const activeStyle = "bg-blue-100 text-blue-600 font-medium";

  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
      <h2 className="text-xl font-bold text-gray-800 mb-10">
        Opportunity Portal
      </h2>

      <nav className="flex flex-col gap-2 flex-1">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `${baseStyle} ${isActive ? activeStyle : ""}`
          }
        >
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        <NavLink
          to="/opportunities"
          className={({ isActive }) =>
            `${baseStyle} ${isActive ? activeStyle : ""}`
          }
        >
          <Briefcase size={18} />
          Opportunities
        </NavLink>

        <NavLink
          to="/add"
          className={({ isActive }) =>
            `${baseStyle} ${isActive ? activeStyle : ""}`
          }
        >
          <PlusCircle size={18} />
          Add Opportunity
        </NavLink>

        <NavLink
          to="/calendar"
          className={({ isActive }) =>
            `${baseStyle} ${isActive ? activeStyle : ""}`
          }
        >
          <Calendar size={18} />
          Calendar
        </NavLink>
      </nav>

      <button className="flex items-center gap-3 text-red-500 mt-6 hover:text-red-600 transition">
        <LogOut size={18} />
        Logout
      </button>
    </aside>
  );
}
