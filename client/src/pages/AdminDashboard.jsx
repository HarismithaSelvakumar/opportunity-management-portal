import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import API from "../services/api";
import Spinner from "../components/common/Spinner";
import ErrorBox from "../components/common/ErrorBox";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await API.get("/dashboard/admin");
        setData(res.data);
      } catch (e) {
        setErr(e?.response?.data?.error || "Failed to load admin dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Spinner message="Loading admin dashboard..." />;

  if (err)
    return (
      <div className="p-6">
        <ErrorBox message={err} />
      </div>
    );

  const totals = data?.totals || {};
  const statusCounts = data?.statusCounts || {};
  const contributorRequests = data?.contributorRequests || {};
  const top = data?.topOpportunities || [];
  const recent = data?.recentApplications || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Platform overview and application activity.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            to="/moderation"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
          >
            Go to Moderation
          </Link>
          <Link
            to="/contributors"
            className="px-4 py-2 rounded-lg bg-white border text-gray-700 hover:bg-gray-50 text-sm font-medium"
          >
            Contributor Profiles
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card title="Total Users" value={totals.totalUsers || 0} />
        <Card
          title="Total Contributors"
          value={totals.totalContributors || 0}
          link="/contributors"
          linkText="View"
        />
        <Card
          title="Total Opportunities"
          value={totals.totalOpportunities || 0}
        />
        <Card
          title="Pending Contributor Requests"
          value={contributorRequests.Pending || 0}
          link="/contributor-requests"
          linkText="Review"
        />
      </div>

      {/* Status counts */}
      <div className="bg-white shadow rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Application Status Counts
        </h2>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.keys(statusCounts).length === 0 ? (
            <div className="text-gray-500">No applications yet.</div>
          ) : (
            Object.entries(statusCounts).map(([k, v]) => (
              <div key={k} className="border rounded-xl p-4">
                <div className="text-sm text-gray-500">{k}</div>
                <div className="text-2xl font-bold">{v}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Top opportunities */}
      <div className="bg-white shadow rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Top Opportunities (by applicants)
        </h2>

        {top.length === 0 ? (
          <p className="text-gray-500 mt-3">No data yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3">Company</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Applicants</th>
                  <th className="p-3">Avg Rating</th>
                  <th className="p-3">Total Ratings</th>
                </tr>
              </thead>
              <tbody>
                {top.map((o, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-3">{o.company}</td>
                    <td className="p-3">{o.title}</td>
                    <td className="p-3">{o.type}</td>
                    <td className="p-3 font-semibold">{o.applicants}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{o.ratings?.averageRating || "—"}</span>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={
                                i < Math.round(o.ratings?.averageRating || 0)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }
                            />
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-gray-600">{o.ratings?.totalRatings || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent applications */}
      <div className="bg-white shadow rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Recent Applications
        </h2>

        {recent.length === 0 ? (
          <p className="text-gray-500 mt-3">No applications yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Opportunity</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((a) => (
                  <tr key={a._id} className="border-t">
                    <td className="p-3">
                      {a.userId?.name || "-"}{" "}
                      <span className="text-gray-500">
                        ({a.userId?.email || "-"})
                      </span>
                    </td>
                    <td className="p-3">
                      {a.opportunityId?.title || "-"}{" "}
                      <span className="text-gray-500">
                        • {a.opportunityId?.company || "-"}
                      </span>
                    </td>
                    <td className="p-3 font-medium">{a.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ title, value, link, linkText }) {
  return (
    <div className="bg-white shadow rounded-2xl p-6">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-3xl font-bold text-gray-900 mt-2">{value}</div>
      {link && linkText && (
        <Link
          to={link}
          className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block"
        >
          {linkText} →
        </Link>
      )}
    </div>
  );
}
