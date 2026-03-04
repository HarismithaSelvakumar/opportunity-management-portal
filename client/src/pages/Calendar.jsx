import { useEffect, useMemo, useState } from "react";
import API from "../services/api";

const FILTERS = ["All", "Upcoming", "Overdue", "No Deadline"];

export default function Calendar() {
  const [opps, setOpps] = useState([]);
  const [apps, setApps] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("Upcoming");

  // ---- Load both opportunities + applications (portal + external)
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
        setErr(e?.response?.data?.error || "Failed to load calendar data");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // ---- Helpers
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const toDateOnly = (dt) => {
    const d = new Date(dt);
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const daysDiff = (a, b) => {
    // a - b in days
    const ms = 24 * 60 * 60 * 1000;
    return Math.round((a.getTime() - b.getTime()) / ms);
  };

  // ---- Build events from Opportunities (portal deadlines)
  const oppEvents = useMemo(() => {
    return opps
      .filter((o) => o?.deadline)
      .map((o) => {
        const d = toDateOnly(o.deadline);
        if (!d) return null;

        return {
          key: `opp-${o._id}`,
          source: "Opportunity",
          title: o.title || "-",
          company: o.company || "-",
          type: o.type || "-",
          status: null, // not an application status
          date: d,
          link: o.link || "",
        };
      })
      .filter(Boolean);
  }, [opps]);

  // ---- Build events from Applications (external deadlines + portal applications if needed)
  const appEvents = useMemo(() => {
    return apps
      .map((a) => {
        // External
        if (!a.opportunityId) {
          const d = a.externalDeadline ? toDateOnly(a.externalDeadline) : null;

          return {
            key: `app-ext-${a._id}`,
            source: "External Application",
            title: a.externalTitle || "-",
            company: a.externalCompany || "-",
            type: a.externalType || "-",
            status: a.status || "Applied",
            date: d, // can be null
            link: a.externalLink || "",
          };
        }

        // Portal application (has opportunityId)
        // We will still show it ONLY if the opportunity has a deadline.
        const opp = a.opportunityId;
        const d = opp?.deadline ? toDateOnly(opp.deadline) : null;

        return {
          key: `app-portal-${a._id}`,
          source: "Portal Application",
          title: opp?.title || "-",
          company: opp?.company || "-",
          type: opp?.type || "-",
          status: a.status || "Applied",
          date: d, // can be null
          link: opp?.link || "",
        };
      })
      .filter(Boolean);
  }, [apps]);

  // ---- Combine + de-duplicate (optional)
  // We will show:
  // - Opportunity deadlines (as “Opportunity”)
  // - Application deadlines (Portal Application + External Application)
  // This is useful because it shows both listing deadlines AND what you applied to.
  const allEvents = useMemo(() => {
    return [...oppEvents, ...appEvents];
  }, [oppEvents, appEvents]);

  // ---- Filter + sort
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    let list = allEvents.slice();

    // Search
    if (query) {
      list = list.filter((e) => {
        return (
          (e.company || "").toLowerCase().includes(query) ||
          (e.title || "").toLowerCase().includes(query) ||
          (e.type || "").toLowerCase().includes(query) ||
          (e.source || "").toLowerCase().includes(query)
        );
      });
    }

    // Filter by deadline status
    if (filter === "Upcoming") {
      list = list.filter((e) => e.date && e.date >= todayStart);
    } else if (filter === "Overdue") {
      list = list.filter((e) => e.date && e.date < todayStart);
    } else if (filter === "No Deadline") {
      list = list.filter((e) => !e.date);
    }

    // Sort:
    // - dated events first by soonest
    // - then no-deadline events last
    list.sort((a, b) => {
      if (a.date && b.date) return a.date - b.date;
      if (a.date && !b.date) return -1;
      if (!a.date && b.date) return 1;
      return 0;
    });

    return list;
  }, [allEvents, q, filter, todayStart]);

  // ---- Summary counts
  const summary = useMemo(() => {
    const total = allEvents.length;
    const upcoming = allEvents.filter((e) => e.date && e.date >= todayStart).length;
    const overdue = allEvents.filter((e) => e.date && e.date < todayStart).length;
    const noDeadline = allEvents.filter((e) => !e.date).length;
    return { total, upcoming, overdue, noDeadline };
  }, [allEvents, todayStart]);

  // ---- UI states
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-6 text-gray-700">
        Loading calendar...
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
          Tip: Ensure backend is running and you are logged in.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar & Deadlines</h1>
          <p className="text-gray-600 mt-1">
            Shows deadlines from Opportunities + your Portal/External applications.
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <Stat title="Total" value={summary.total} />
        <Stat title="Upcoming" value={summary.upcoming} />
        <Stat title="Overdue" value={summary.overdue} />
        <Stat title="No Deadline" value={summary.noDeadline} />
      </div>

      {/* Controls */}
      <div className="bg-white shadow rounded-2xl p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search company, title, type, source..."
          className="w-full md:w-1/2 border rounded-lg px-4 py-2"
        />

        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Show:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 bg-white"
          >
            {FILTERS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white shadow rounded-2xl p-6 text-gray-500">
          No items match your filter.
        </div>
      ) : (
        <div className="bg-white shadow rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4">When</th>
                <th className="p-4">Company</th>
                <th className="p-4">Title</th>
                <th className="p-4">Type</th>
                <th className="p-4">Source</th>
                <th className="p-4">Status</th>
                <th className="p-4">Link</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((e) => {
                const badge = getUrgencyBadge(e.date, todayStart, daysDiff);
                return (
                  <tr key={e.key} className="border-t align-top">
                    <td className="p-4">
                      {e.date ? (
                        <div className="space-y-1">
                          <div className="font-medium">
                            {e.date.toLocaleDateString()}
                          </div>
                          <div>{badge}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">No deadline</span>
                      )}
                    </td>

                    <td className="p-4 font-medium">{e.company}</td>

                    <td className="p-4">
                      <div className="font-medium text-gray-900">{e.title}</div>
                    </td>

                    <td className="p-4">{e.type}</td>

                    <td className="p-4">
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700">
                        {e.source}
                      </span>
                    </td>

                    <td className="p-4">
                      {e.status ? (
                        <span className="text-sm font-medium">{e.status}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    <td className="p-4">
                      {e.link ? (
                        <a
                          href={e.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline text-sm"
                        >
                          Open
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ title, value }) {
  return (
    <div className="bg-white shadow rounded-2xl p-6">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-3xl font-bold text-gray-900 mt-2">{value}</div>
    </div>
  );
}

function getUrgencyBadge(date, todayStart, daysDiff) {
  if (!date) return null;

  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  const diff = daysDiff(d, todayStart);

  if (diff < 0) {
    return (
      <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700">
        Overdue ({Math.abs(diff)}d)
      </span>
    );
  }

  if (diff === 0) {
    return (
      <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700">
        Today
      </span>
    );
  }

  if (diff <= 3) {
    return (
      <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-yellow-50 border border-yellow-200 text-yellow-800">
        Due in {diff}d
      </span>
    );
  }

  return (
    <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700">
      Due in {diff}d
    </span>
  );
}