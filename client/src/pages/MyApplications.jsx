import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

const STATUS_OPTIONS = ["All", "Saved", "Applied", "Test", "Interview", "Offer", "Selected", "Rejected"];

export default function MyApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchApps = async () => {
    setLoading(true);
    try {
      const res = await API.get("/applications/me");
      setApps(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const updateApp = async (id, payload) => {
    try {
      await API.patch(`/applications/${id}`, payload);
      await fetchApps();
    } catch (err) {
      alert(err?.response?.data?.error || "Update failed");
    }
  };

  // normalize: portal vs external display fields
  const normalized = useMemo(() => {
    return apps.map((a) => {
      const opp = a.opportunityId;
      const isExternal = !opp;

      return {
        _id: a._id,
        status: a.status,
        notes: a.notes || "",
        locked: ["Selected", "Rejected"].includes(a.status),

        source: isExternal ? "External" : "Portal",

        company: isExternal ? (a.externalCompany || "-") : (opp?.company || "-"),
        title: isExternal ? (a.externalTitle || "-") : (opp?.title || "-"),
        type: isExternal ? (a.externalType || "-") : (opp?.type || "-"),
        deadline: isExternal ? a.externalDeadline : opp?.deadline,
        link: isExternal ? a.externalLink : opp?.link,
      };
    });
  }, [apps]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return normalized.filter((a) => {
      const matchQ =
        !query ||
        a.company.toLowerCase().includes(query) ||
        a.title.toLowerCase().includes(query) ||
        a.type.toLowerCase().includes(query);

      const matchStatus = statusFilter === "All" ? true : a.status === statusFilter;

      return matchQ && matchStatus;
    });
  }, [normalized, q, statusFilter]);

  if (loading) {
    return <div className="bg-white p-6 rounded-xl shadow">Loading applications...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
          <p className="text-gray-600 mt-1">Track both portal and external applications.</p>
        </div>

        <div className="flex gap-3">
          <Link
            to="/applications/external/new"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
          >
            + Add External
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-2xl p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search company, title, type..."
          className="w-full md:w-1/2 border rounded-lg px-4 py-2"
        />

        <div className="flex gap-3 items-center">
          <label className="text-sm text-gray-600">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 bg-white"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white p-6 rounded-xl shadow text-gray-500">
          No applications found.
        </div>
      ) : (
        <div className="bg-white shadow rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4">Source</th>
                <th className="p-4">Company</th>
                <th className="p-4">Title</th>
                <th className="p-4">Type</th>
                <th className="p-4">Status</th>
                <th className="p-4">Deadline</th>
                <th className="p-4">Notes</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((a) => (
                <tr key={a._id} className="border-t align-top">
                  <td className="p-4 text-sm">
                    <span className="px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700">
                      {a.source}
                    </span>
                  </td>

                  <td className="p-4 font-medium">{a.company}</td>
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{a.title}</div>
                    {a.link ? (
                      <a
                        href={a.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-600 underline"
                      >
                        View link
                      </a>
                    ) : null}
                  </td>
                  <td className="p-4">{a.type}</td>

                  <td className="p-4">
                    <select
                      value={a.status}
                      disabled={a.locked}
                      onChange={(e) => updateApp(a._id, { status: e.target.value })}
                      className="border px-3 py-2 rounded-lg w-full"
                    >
                      <option>Saved</option>
                      <option>Applied</option>
                      <option>Test</option>
                      <option>Interview</option>
                      <option>Offer</option>
                      <option>Selected</option>
                      <option>Rejected</option>
                    </select>

                    {a.locked && <p className="text-xs text-gray-500 mt-1">Final status locked</p>}
                  </td>

                  <td className="p-4">
                    {a.deadline ? new Date(a.deadline).toLocaleDateString() : "-"}
                  </td>

                  <td className="p-4">
                    <textarea
                      defaultValue={a.notes}
                      disabled={a.locked}
                      onBlur={(e) => updateApp(a._id, { notes: e.target.value })}
                      className="w-full border rounded-lg p-2"
                      rows={3}
                      placeholder="Interview notes..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Notes save when you click outside.</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}