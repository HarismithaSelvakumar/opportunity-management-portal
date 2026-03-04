import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

export default function Opportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appsLoading, setAppsLoading] = useState(false);
  const [error, setError] = useState("");
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [applyingFor, setApplyingFor] = useState(null);

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role || "guest";

  const isUser = role === "user";

  const fetchOpportunities = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/opportunities");
      setOpportunities(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load opportunities");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyApplications = async () => {
    if (!isUser) return; // only users apply
    setAppsLoading(true);
    try {
      const res = await API.get("/applications/me");
      const ids = new Set(
        (res.data || []).map((a) => a.opportunityId?._id || a.opportunityId)
      );
      setAppliedIds(ids);
    } catch {
      // ignore
    } finally {
      setAppsLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
    fetchMyApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApply = async (opportunityId) => {
    if (!isUser) return;

    if (appliedIds.has(opportunityId)) {
      alert("You already applied.");
      return;
    }

    try {
      setApplyingFor(opportunityId);
      await API.post("/applications", { opportunityId });
      setAppliedIds((prev) => new Set(prev).add(opportunityId));
      alert("Applied ✅");
    } catch (err) {
      alert(err?.response?.data?.error || "Apply failed");
    } finally {
      setApplyingFor(null);
    }
  };

  if (loading) return <div>Loading opportunities...</div>;
  if (error)
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded">
        <strong>Error:</strong> {error}
      </div>
    );

  return (
    <div>
      <div className="flex justify-between mb-6 items-center">
        <h1 className="text-3xl font-bold">Opportunities</h1>

        <div className="flex gap-3 items-center">
          {isUser && (
            <Link
              to="/applications"
              className="bg-white border px-4 py-2 rounded hover:shadow-sm text-sm"
            >
              My Applications
            </Link>
          )}
        </div>
      </div>

      <div className="mb-4 text-sm text-gray-500">
        {isUser
          ? appsLoading
            ? "Loading your applications..."
            : "Click Apply to add this opportunity to your tracker."
          : "Only approved opportunities are shown. Apply is available only for USER role."}
      </div>

      {opportunities.length === 0 ? (
        <div className="bg-white p-6 rounded-xl shadow text-gray-500">
          No opportunities found.
        </div>
      ) : (
        <table className="w-full bg-white shadow rounded">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Company</th>
              <th className="p-3 text-left">Title</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Deadline</th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {opportunities.map((o) => {
              const already = appliedIds.has(o._id);

              return (
                <tr key={o._id} className="border-t">
                  <td className="p-3">{o.company}</td>
                  <td className="p-3">{o.title}</td>
                  <td className="p-3">{o.type}</td>
                  <td className="p-3">
                    {o.deadline ? new Date(o.deadline).toLocaleDateString() : "-"}
                  </td>

                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <a
                        href={o.link || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-sm px-3 py-1 rounded ${
                          o.link ? "underline text-blue-600" : "text-gray-400"
                        }`}
                      >
                        View
                      </a>

                      {isUser ? (
                        <button
                          onClick={() => handleApply(o._id)}
                          disabled={already || applyingFor === o._id}
                          className={`px-3 py-1 rounded text-sm ${
                            already
                              ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                              : "bg-green-100 text-green-700 hover:bg-green-200"
                          }`}
                        >
                          {applyingFor === o._id
                            ? "Applying..."
                            : already
                            ? "Applied"
                            : "Apply"}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500">
                          Apply disabled
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}