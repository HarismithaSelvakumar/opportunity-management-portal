import { useEffect, useState } from "react";
import { useAuth } from "../contexts/useAuth";
import API from "../services/api";
import Spinner from "../components/common/Spinner";
import ErrorBox from "../components/common/ErrorBox";

export default function Profile() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Fetch applications count for users
        if (user?.role === "user") {
          const appRes = await API.get("/applications/me");
          setStats({
            type: "applications",
            count: (appRes.data || []).length,
          });
        }
        // Fetch submissions count for contributors
        else if (user?.role === "contributor") {
          const subRes = await API.get("/opportunities/submissions/me");
          setStats({
            type: "submissions",
            count: (subRes.data || []).length,
          });
        }
        // For admins, we could fetch moderation stats
        else if (user?.role === "admin") {
          const modRes = await API.get("/opportunities/moderation/pending");
          setStats({
            type: "pending",
            count: (modRes.data || []).length,
          });
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  if (!user) {
    return <ErrorBox error="No user data available" />;
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "contributor":
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  const getProviderBadgeColor = (provider) => {
    return provider === "google"
      ? "bg-orange-50 text-orange-700 border-orange-200"
      : "bg-gray-50 text-gray-700 border-gray-200";
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-1">Your account information</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header with avatar placeholder */}
        <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-500"></div>

        <div className="p-6 pt-0">
          {/* Avatar & Name */}
          <div className="flex items-end gap-4 mb-6">
            <div className="w-24 h-24 -mt-12 rounded-full bg-gray-200 border-4 border-white flex items-center justify-center text-2xl font-bold text-gray-400">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-gray-500 text-sm">{user.email}</p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Role */}
            <div>
              <label className="text-sm font-medium text-gray-500">Role</label>
              <div className="mt-2 flex items-center">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold border ${getRoleBadgeColor(
                    user.role,
                  )}`}
                >
                  {user.role.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Provider */}
            <div>
              <label className="text-sm font-medium text-gray-500">
                Login Method
              </label>
              <div className="mt-2 flex items-center">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold border ${getProviderBadgeColor(
                    user.provider,
                  )}`}
                >
                  {user.provider === "google" ? "Google" : "Email & Password"}
                </span>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="mt-2 text-gray-900 font-mono text-sm break-all">
                {user.email}
              </p>
            </div>

            {/* Member Since */}
            <div>
              <label className="text-sm font-medium text-gray-500">
                Member Since
              </label>
              <p className="mt-2 text-gray-900">
                {formatDate(user.createdAt || new Date())}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      {!loading && stats && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {user.role === "user"
              ? "Application Summary"
              : user.role === "contributor"
                ? "Submission Summary"
                : "Moderation Summary"}
          </h3>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-500">
                {user.role === "user"
                  ? "Total Applications"
                  : user.role === "contributor"
                    ? "Total Submissions"
                    : "Pending Moderations"}
              </p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {stats.count}
              </p>
            </div>
            <div className="text-4xl text-gray-200">
              {user.role === "user"
                ? "📋"
                : user.role === "contributor"
                  ? "📤"
                  : "⚖️"}
            </div>
          </div>
        </div>
      )}

      {loading && <Spinner />}

      {/* Footer note */}
      <div className="text-sm text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p>
          Your profile information is automatically synced from your account. To
          update your details, please contact an administrator.
        </p>
      </div>
    </div>
  );
}
