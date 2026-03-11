import { useAuth } from "../contexts/useAuth";
import Dashboard from "./Dashboard";
import AdminDashboard from "./AdminDashboard";
import ContributorDashboard from "./ContributorDashboard";

export default function DashboardRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  const role = user?.role;

  if (role === "admin") return <AdminDashboard />;
  if (role === "contributor") return <ContributorDashboard />;
  return <Dashboard />;
}
