import { useEffect, useState } from "react";
import API from "../services/api";

export default function AdminModeration() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // store rejection reasons per row
  const [reasons, setReasons] = useState({});

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await API.get("/opportunities/moderation/pending");
      setPending(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to load pending submissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (id) => {
    try {
      await API.patch(`/opportunities/moderation/${id}/approve`);
      await load();
    } catch (e) {
      alert(e?.response?.data?.error || "Approve failed");
    }
  };

  const reject = async (id) => {
    const reason = (reasons[id] || "").trim();
    if (!reason) return alert("Enter a rejection reason first.");

    try {
      await API.patch(`/opportunities/moderation/${id}/reject`, { reason });
      await load();
    } catch (e) {
      alert(e?.response?.data?.error || "Reject failed");
    }
  };

  if (loading) return <div className="bg-white p-6 rounded-xl shadow">Loading moderation queue...</div>;

  if (err)
    return (
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">{err}</div>
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Moderation</h1>
        <p className="text-gray-600 mt-1">Approve or reject contributor submissions. Only approved items appear to users.</p>
      </div>

      {pending.length === 0 ? (
        <div className="bg-white p-6 rounded-xl shadow text-gray-500">No pending submissions.</div>
      ) : (
        <div className="bg-white shadow rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4">Submitted By</th>
                <th className="p-4">Company</th>
                <th className="p-4">Title</th>
                <th className="p-4">Type</th>
                <th className="p-4">Deadline</th>
                <th className="p-4">Link</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((o) => (
                <tr key={o._id} className="border-t align-top">
                  <td className="p-4 text-sm">
                    <div className="font-medium">{o.createdBy?.name || "-"}</div>
                    <div className="text-gray-500">{o.createdBy?.email || "-"}</div>
                  </td>

                  <td className="p-4 font-medium">{o.company}</td>
                  <td className="p-4">{o.title}</td>
                  <td className="p-4">{o.type}</td>
                  <td className="p-4">
                    {o.deadline ? new Date(o.deadline).toLocaleDateString() : "-"}
                  </td>

                  <td className="p-4">
                    {o.link ? (
                      <a href={o.link} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm">
                        Open
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  <td className="p-4 space-y-2">
                    <button
                      onClick={() => approve(o._id)}
                      className="w-full px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm font-medium"
                    >
                      Approve
                    </button>

                    <textarea
                      rows={2}
                      placeholder="Rejection reason..."
                      value={reasons[o._id] || ""}
                      onChange={(e) =>
                        setReasons((p) => ({ ...p, [o._id]: e.target.value }))
                      }
                      className="w-full border rounded-lg p-2 text-sm"
                    />

                    <button
                      onClick={() => reject(o._id)}
                      className="w-full px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm font-medium"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button onClick={load} className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-50 text-sm font-medium">
        Refresh
      </button>
    </div>
  );
}