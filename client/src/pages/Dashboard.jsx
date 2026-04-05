import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import Spinner from "../components/common/Spinner";
import ErrorBox from "../components/common/ErrorBox";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const STATUS_ORDER = [
  "Saved",
  "Applied",
  "Test",
  "Interview",
  "Offer",
  "Selected",
  "Rejected",
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // fetch dashboard payload from backend
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await API.get("/dashboard/user");
        setData(res.data);
      } catch (e) {
        setErr(e?.response?.data?.error || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // the server already returns totals, statusCounts, and upcomingDeadlines
  const statusCounts = useMemo(() => data?.statusCounts || {}, [data]);
  const totalOpportunities = data?.totals?.totalOpportunities || 0;
  const totalApplications = data?.totals?.myApplications || 0;

  // success metrics (offer + selected) can still be derived from statusCounts
  const offers = statusCounts["Offer"] || 0;
  const selected = statusCounts["Selected"] || 0;
  const rejected = statusCounts["Rejected"] || 0;

  const successRate = useMemo(() => {
    if (totalApplications === 0) return 0;
    const success = offers + selected;
    return Math.round((success / totalApplications) * 100);
  }, [offers, selected, totalApplications]);

  const pieData = useMemo(() => {
    return STATUS_ORDER.filter((s) => statusCounts[s] > 0).map((s) => ({
      name: s,
      value: statusCounts[s],
    }));
  }, [statusCounts]);

  // trend line similar to before, but only need createdAt from backend applications
  const lineData = useMemo(() => {
    const bucket = new Map();
    const apps = data?.applications || [];
    for (const a of apps) {
      const d = a?.createdAt ? new Date(a.createdAt) : null;
      if (!d || Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      bucket.set(key, (bucket.get(key) || 0) + 1);
    }
    const keys = Array.from(bucket.keys()).sort();
    return keys.map((k) => ({
      month: k,
      applications: bucket.get(k),
    }));
  }, [data]);

  const upcomingDeadlines = useMemo(
    () => data?.upcomingDeadlines || [],
    [data],
  );

  // if backend doesn't provide arrays yet, keep backwards compatibility by
  // allowing manual computation, but normally data.applications will exist.

  // ------- UI
  if (loading) {
    return <Spinner message="Loading dashboard..." />;
  }

  if (err) {
    return (
      <div className="p-6">
        <ErrorBox message={err} />
        <p className="text-sm text-gray-500 mt-3">
          Tip: Ensure backend is running on port 5000 and you are logged in.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Track portal + external applications, statuses, and deadlines.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            to="/opportunities"
            className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-50 text-sm font-medium"
          >
            View Opportunities
          </Link>

          <Link
            to="/applications"
            className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-90 text-sm font-medium"
          >
            My Applications
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <StatCard title="Total Opportunities" value={totalOpportunities} />
        <StatCard title="My Applications" value={totalApplications} />
        <StatCard title="Interviews" value={statusCounts["Interview"] || 0} />
        <StatCard title="Offers" value={offers} />
        <StatCard title="Success Rate" value={`${successRate}%`} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line */}
        <div className="bg-white shadow rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            Applications Trend
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Based on when you created applications (portal + external).
          </p>

          <div className="h-72 min-h-[18rem]">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minHeight={200}
              minWidth={0}
            >
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="applications" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {lineData.length === 0 && (
            <p className="text-sm text-gray-500 mt-3">
              No trend yet — apply or add an external application to see
              updates.
            </p>
          )}
        </div>

        {/* Pie */}
        <div className="bg-white shadow rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            Status Distribution
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Distribution of your applications by stage.
          </p>

          <div className="h-72 min-h-[18rem]">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minHeight={200}
              minWidth={0}
            >
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={95}
                  label
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {pieData.length === 0 && (
            <p className="text-sm text-gray-500 mt-3">
              No applications found — once you apply or add external, this chart
              will populate.
            </p>
          )}
        </div>
      </div>

      {/* Upcoming deadlines */}
      <div className="bg-white shadow rounded-2xl p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Upcoming Deadlines (Next 14 days)
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Includes opportunity deadlines + external deadlines.
            </p>
          </div>

          <Link
            to="/calendar"
            className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-50 text-sm font-medium"
          >
            Open Calendar
          </Link>
        </div>

        {upcomingDeadlines.length === 0 ? (
          <div className="mt-4 text-gray-500">
            No deadlines in the next 14 days.
          </div>
        ) : (
          <div className="mt-4 divide-y">
            {upcomingDeadlines.map((x) => (
              <div
                key={x.key}
                className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div>
                  <div className="font-semibold text-gray-900">
                    {x.title}{" "}
                    <span className="text-gray-500 font-normal">
                      • {x.company}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Type: {x.type}{" "}
                    <span className="ml-2 inline-block text-xs px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-gray-700">
                      {x.source}
                    </span>
                  </div>
                </div>

                <div className="text-sm font-medium text-red-600">
                  {new Date(x.deadline).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick metrics note */}
      <div className="bg-gray-50 border border-gray-200 text-gray-700 p-5 rounded-2xl">
        <div className="font-semibold mb-1">Analytics notes</div>
        <div className="text-sm leading-relaxed">
          <b>Success Rate</b> is computed as{" "}
          <b>(Offer + Selected) / Total Applications</b>. You can explain this
          in viva as a simple KPI for application progress. Rejected count:{" "}
          <b>{rejected}</b>.
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white shadow rounded-2xl p-6">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-3xl font-bold text-gray-900 mt-2">{value}</div>
    </div>
  );
}
