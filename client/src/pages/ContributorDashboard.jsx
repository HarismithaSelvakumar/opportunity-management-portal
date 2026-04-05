import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import Spinner from "../components/common/Spinner";
import ErrorBox from "../components/common/ErrorBox";

export default function ContributorDashboard() {
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
        setErr(
          e?.response?.data?.error || "Failed to load contributor dashboard",
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Spinner message="Loading contributor dashboard..." />;

  if (err)
    return (
      <div className="p-6">
        <ErrorBox message={err} />
      </div>
    );

  const totals = data?.totals || {};
  const approvalCounts = data?.approvalCounts || {
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
  };
  const top = data?.topByApplicants || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Contributor Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Track your submissions and applicant interest.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            to="/submit"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
          >
            + Submit Opportunity
          </Link>
          <Link
            to="/contributor-analytics"
            className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-50 text-sm font-medium"
          >
            View Analytics
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <Card title="My Submissions" value={totals.mySubmissions || 0} />
        <Card title="Pending" value={approvalCounts.PENDING || 0} />
        <Card title="Approved" value={approvalCounts.APPROVED || 0} />
        <Card title="Rejected" value={approvalCounts.REJECTED || 0} />
      </div>

      <div className="bg-white shadow rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Top Posted Opportunities
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Ranked by number of applicants.
        </p>

        {top.length === 0 ? (
          <p className="text-gray-500 mt-4">No applicants yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3">Company</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Applicants</th>
                  <th className="p-3">Approval</th>
                </tr>
              </thead>
              <tbody>
                {top.map((o) => (
                  <tr key={o.opportunityId} className="border-t">
                    <td className="p-3">{o.company}</td>
                    <td className="p-3">{o.title}</td>
                    <td className="p-3 font-semibold">{o.applicants}</td>
                    <td className="p-3">
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700">
                        {o.approvalStatus}
                      </span>
                    </td>
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
