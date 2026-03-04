import { useEffect, useState } from "react";
import API from "../services/api";

export default function MySubmissions() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await API.get("/opportunities/submissions/me");
      setList(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div className="bg-white p-6 rounded-xl shadow">Loading submissions...</div>;

  if (err)
    return (
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">{err}</div>
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Submissions</h1>
        <p className="text-gray-600 mt-1">Track approval status of the opportunities you submitted.</p>
      </div>

      {list.length === 0 ? (
        <div className="bg-white p-6 rounded-xl shadow text-gray-500">No submissions yet.</div>
      ) : (
        <div className="bg-white shadow rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4">Company</th>
                <th className="p-4">Title</th>
                <th className="p-4">Type</th>
                <th className="p-4">Status</th>
                <th className="p-4">Reason</th>
              </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o._id} className="border-t align-top">
                  <td className="p-4 font-medium">{o.company}</td>
                  <td className="p-4">{o.title}</td>
                  <td className="p-4">{o.type}</td>
                  <td className="p-4">
                    <Badge status={o.approvalStatus} />
                  </td>
                  <td className="p-4 text-sm text-gray-600">{o.rejectedReason || "-"}</td>
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

function Badge({ status }) {
  const map = {
    PENDING: "bg-yellow-50 text-yellow-800 border-yellow-200",
    APPROVED: "bg-green-50 text-green-800 border-green-200",
    REJECTED: "bg-red-50 text-red-800 border-red-200",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${map[status] || "bg-gray-50 border-gray-200 text-gray-700"}`}>
      {status}
    </span>
  );
}