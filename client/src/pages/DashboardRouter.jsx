import Dashboard from "./Dashboard";
import AdminDashboard from "./AdminDashboard";
import ContributorDashboard from "./ContributorDashboard";

export default function DashboardRouter() {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  const role = user?.role;

  if (role === "admin") return <AdminDashboard />;
  if (role === "contributor") return <ContributorDashboard />;
  return <Dashboard />;
}
