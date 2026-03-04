import { useEffect, useMemo, useState } from "react";
import API from "../services/api";

export default function ContributorAnalytics() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await API.get("/dashboard/contributor");
        setData(res.data);
      } catch (e) {
        setErr(e?.response?.data?.error || "Failed to load contributor analytics");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const rows = useMemo(() => data?.submissions || [], [data]);
  const approvalCounts = data?.approvalCounts || { PENDING: 0, APPROVED: 0, REJECTED: 0 };

  if (loading) return <div className="bg-white p-6 rounded-xl shadow">Loading analytics...</div>;

  if (err)
    return (
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">{err}</div>
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Contributor Analytics</h1>
        <p className="text-gray-600 mt-1">
          Shows applicants only for opportunities you posted (ownership-based).
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <Card title="Total Submissions" value={data?.totals?.mySubmissions || 0} />
        <Card title="Pending" value={approvalCounts.PENDING || 0} />
        <Card title="Approved" value={approvalCounts.APPROVED || 0} />
        <Card title="Rejected" value={approvalCounts.REJECTED || 0} />
      </div>

      {rows.length === 0 ? (
        <div className="bg-white p-6 rounded-xl shadow text-gray-500">No submissions yet.</div>
      ) : (
        <div className="bg-white shadow rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4">Company</th>
                <th className="p-4">Title</th>
                <th className="p-4">Type</th>
                <th className="p-4">Approval</th>
                <th className="p-4">Applicants</th>
                <th className="p-4">Rejected Reason</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.opportunityId} className="border-t align-top">
                  <td className="p-4 font-medium">{o.company}</td>
                  <td className="p-4">{o.title}</td>
                  <td className="p-4">{o.type}</td>
                  <td className="p-4">
                    <Badge status={o.approvalStatus} />
                  </td>
                  <td className="p-4 font-semibold">{o.applicants}</td>
                  <td className="p-4 text-sm text-gray-600">{o.rejectedReason || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-white shadow rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-gray-900">Top Opportunities (by applicants)</h2>

        {(!data?.topByApplicants || data.topByApplicants.length === 0) ? (
          <p className="text-gray-500 mt-3">No applicants yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3">Company</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Applicants</th>
                </tr>
              </thead>
              <tbody>
                {data.topByApplicants.map((o) => (
                  <tr key={o.opportunityId} className="border-t">
                    <td className="p-3">{o.company}</td>
                    <td className="p-3">{o.title}</td>
                    <td className="p-3 font-semibold">{o.applicants}</td>
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

function Card({ title, value }) {
  return (
    <div className="bg-white shadow rounded-2xl p-6">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-3xl font-bold text-gray-900 mt-2">{value}</div>
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