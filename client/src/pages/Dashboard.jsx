import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
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
  const [opps, setOpps] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // read user from localStorage
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  // fetch real data
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr("");
      try {
        const [oppRes, appRes] = await Promise.all([
          API.get("/opportunities"),
          API.get("/applications/me"),
        ]);

        setOpps(Array.isArray(oppRes.data) ? oppRes.data : []);
        setApps(Array.isArray(appRes.data) ? appRes.data : []);
      } catch (e) {
        setErr(e?.response?.data?.error || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // -------- Normalize apps (Portal + External)
  const normalizedApps = useMemo(() => {
    return apps.map((a) => {
      const opp = a.opportunityId;
      const isExternal = !opp;

      return {
        id: a._id,
        source: isExternal ? "External" : "Portal",
        status: a.status || "Applied",

        title: isExternal ? (a.externalTitle || "-") : (opp?.title || "-"),
        company: isExternal ? (a.externalCompany || "-") : (opp?.company || "-"),
        type: isExternal ? (a.externalType || "-") : (opp?.type || "-"),

        // deadline comes from opportunity deadline (portal) OR externalDeadline
        deadline: isExternal ? a.externalDeadline : opp?.deadline,

        // createdAt used for trend
        createdAt: a.createdAt,
      };
    });
  }, [apps]);

  // ------- Status counts
  const statusCounts = useMemo(() => {
    const counts = {};
    STATUS_ORDER.forEach((s) => (counts[s] = 0));

    for (const a of normalizedApps) {
      const st = a.status || "Applied";
      counts[st] = (counts[st] || 0) + 1;
    }
    return counts;
  }, [normalizedApps]);

  const totalOpportunities = opps.length;
  const totalApplications = normalizedApps.length;

  // ------- Success metrics
  const offers = statusCounts["Offer"] || 0;
  const selected = statusCounts["Selected"] || 0;
  const rejected = statusCounts["Rejected"] || 0;

  const successRate = useMemo(() => {
    if (totalApplications === 0) return 0;
    // success = Offer + Selected (you can adjust definition)
    const success = offers + selected;
    return Math.round((success / totalApplications) * 100);
  }, [offers, selected, totalApplications]);

  const pieData = useMemo(() => {
    return STATUS_ORDER.filter((s) => statusCounts[s] > 0).map((s) => ({
      name: s,
      value: statusCounts[s],
    }));
  }, [statusCounts]);

  // ------- Trend line: applications by month
  const lineData = useMemo(() => {
    const bucket = new Map();

    for (const a of normalizedApps) {
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
  }, [normalizedApps]);

  // ------- Upcoming deadlines (next 14 days) from BOTH:
  // 1) Opportunities list deadlines
  // 2) External application deadlines
  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    const limit = new Date();
    limit.setDate(now.getDate() + 14);

    const items = [];

    // (A) Opportunity deadlines (for visibility)
    for (const o of opps) {
      if (!o?.deadline) continue;
      const d = new Date(o.deadline);
      if (Number.isNaN(d.getTime())) continue;
      if (d >= now && d <= limit) {
        items.push({
          key: `opp-${o._id}`,
          source: "Opportunity",
          title: o.title,
          company: o.company,
          type: o.type,
          deadline: d,
        });
      }
    }

    // (B) External application deadlines
    for (const a of normalizedApps) {
      if (a.source !== "External") continue;
      if (!a.deadline) continue;

      const d = new Date(a.deadline);
      if (Number.isNaN(d.getTime())) continue;
      if (d >= now && d <= limit) {
        items.push({
          key: `ext-${a.id}`,
          source: "External Application",
          title: a.title,
          company: a.company,
          type: a.type,
          deadline: d,
        });
      }
    }

    // sort by soonest and take top 10
    items.sort((x, y) => x.deadline - y.deadline);
    return items.slice(0, 10);
  }, [opps, normalizedApps]);

  // ------- UI
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-6 text-gray-700">
        Loading dashboard...
      </div>
    );
  }

  if (err) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <div className="text-red-700 bg-red-50 border border-red-200 p-4 rounded-lg">
          {err}
        </div>
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

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
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
              No trend yet — apply or add an external application to see updates.
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

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
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
              No applications found — once you apply or add external, this chart will populate.
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
          <div className="mt-4 text-gray-500">No deadlines in the next 14 days.</div>
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
          <b>Success Rate</b> is computed as <b>(Offer + Selected) / Total Applications</b>.
          You can explain this in viva as a simple KPI for application progress.
          Rejected count: <b>{rejected}</b>.
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