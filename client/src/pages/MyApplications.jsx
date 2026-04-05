import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import Spinner from "../components/common/Spinner";

const STATUS_OPTIONS = [
  "All",
  "Saved",
  "Applied",
  "Test",
  "Interview",
  "Offer",
  "Selected",
  "Rejected",
];
const TYPE_OPTIONS = ["Job", "Internship", "Hackathon", "Scholarship"];

export default function MyApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Edit modal state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    externalTitle: "",
    externalCompany: "",
    externalType: "",
    externalLink: "",
    externalDeadline: "",
  });
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);

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

        company: isExternal ? a.externalCompany || "-" : opp?.company || "-",
        title: isExternal ? a.externalTitle || "-" : opp?.title || "-",
        type: isExternal ? a.externalType || "-" : opp?.type || "-",
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

      const matchStatus =
        statusFilter === "All" ? true : a.status === statusFilter;

      return matchQ && matchStatus;
    });
  }, [normalized, q, statusFilter]);

  // Open edit modal for external application
  const openEditModal = (app) => {
    const original = apps.find((a) => a._id === app._id);
    setEditForm({
      externalTitle: original?.externalTitle || "",
      externalCompany: original?.externalCompany || "",
      externalType: original?.externalType || "",
      externalLink: original?.externalLink || "",
      externalDeadline: original?.externalDeadline
        ? new Date(original.externalDeadline).toISOString().split("T")[0]
        : "",
    });
    setEditError("");
    setEditingId(app._id);
  };

  const closeEditModal = () => {
    setEditingId(null);
    setEditError("");
  };

  // Validate and submit edit
  const handleEditSubmit = async () => {
    setEditError("");

    const { externalTitle, externalCompany, externalLink } = editForm;

    if (!externalTitle.trim()) {
      setEditError("Title is required");
      return;
    }

    if (!externalCompany.trim()) {
      setEditError("Company is required");
      return;
    }

    if (externalLink && !/^https?:\/\/.+/i.test(externalLink.trim())) {
      setEditError("Link must start with http:// or https://");
      return;
    }

    setEditSaving(true);
    try {
      await API.patch(`/applications/${editingId}`, {
        externalTitle: externalTitle.trim(),
        externalCompany: externalCompany.trim(),
        externalType: editForm.externalType,
        externalLink: externalLink.trim() || "",
        externalDeadline: editForm.externalDeadline
          ? new Date(editForm.externalDeadline)
          : null,
      });

      await fetchApps();
      closeEditModal();
    } catch (err) {
      setEditError(err?.response?.data?.error || "Update failed");
    } finally {
      setEditSaving(false);
    }
  };

  if (loading) {
    return <Spinner message="Loading applications..." />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
          <p className="text-gray-600 mt-1">
            Track both portal and external applications.
          </p>
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
                <th className="p-4">Actions</th>
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
                      onChange={(e) =>
                        updateApp(a._id, { status: e.target.value })
                      }
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

                    {a.locked && (
                      <p className="text-xs text-gray-500 mt-1">
                        Final status locked
                      </p>
                    )}
                  </td>

                  <td className="p-4">
                    {a.deadline
                      ? new Date(a.deadline).toLocaleDateString()
                      : "-"}
                  </td>

                  <td className="p-4">
                    <textarea
                      defaultValue={a.notes}
                      disabled={a.locked}
                      onBlur={(e) =>
                        updateApp(a._id, { notes: e.target.value })
                      }
                      className="w-full border rounded-lg p-2"
                      rows={3}
                      placeholder="Interview notes..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Notes save when you click outside.
                    </p>
                  </td>

                  <td className="p-4">
                    {a.source === "External" && !a.locked && (
                      <button
                        onClick={() => openEditModal(a)}
                        className="px-3 py-1 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm font-medium"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit External Application Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Edit External Application
            </h2>

            {editError && (
              <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-lg text-sm">
                {editError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={editForm.externalTitle}
                onChange={(e) =>
                  setEditForm({ ...editForm, externalTitle: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Software Engineer Internship"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company *
              </label>
              <input
                type="text"
                value={editForm.externalCompany}
                onChange={(e) =>
                  setEditForm({ ...editForm, externalCompany: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Google"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={editForm.externalType}
                onChange={(e) =>
                  setEditForm({ ...editForm, externalType: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2 bg-white"
              >
                <option value="">Select type</option>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link
              </label>
              <input
                type="url"
                value={editForm.externalLink}
                onChange={(e) =>
                  setEditForm({ ...editForm, externalLink: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
                placeholder="https://example.com/apply"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deadline
              </label>
              <input
                type="date"
                value={editForm.externalDeadline}
                onChange={(e) =>
                  setEditForm({ ...editForm, externalDeadline: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button
                onClick={closeEditModal}
                disabled={editSaving}
                className="px-4 py-2 rounded-lg border hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={editSaving}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
              >
                {editSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
