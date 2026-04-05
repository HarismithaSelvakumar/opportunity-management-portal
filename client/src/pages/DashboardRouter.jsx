import { useAuth } from "../contexts/useAuth";
import Spinner from "../components/common/Spinner";
import Dashboard from "./Dashboard";
import AdminDashboard from "./AdminDashboard";
import ContributorDashboard from "./ContributorDashboard";

export default function DashboardRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Spinner message="Loading dashboard..." />;
  }

  const role = user?.role;

  if (role === "admin") return <AdminDashboard />;
  if (role === "contributor") return <ContributorDashboard />;
  return <Dashboard />;
}
