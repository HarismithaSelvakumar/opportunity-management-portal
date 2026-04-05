import { useEffect, useState } from "react";
import API from "../services/api";
import Spinner from "../components/common/Spinner";
import ErrorBox from "../components/common/ErrorBox";

export default function AdminContributors() {
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadContributors = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await API.get("/dashboard/admin-contributors");
      setContributors(res.data.contributors || []);
    } catch (err) {
      setError(
        err?.response?.data?.error || "Failed to load contributor profiles",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContributors();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Contributor Profiles
        </h1>
        <p className="text-gray-600 mt-1">
          View each contributor account and their total contributions.
        </p>
      </div>

      {error && <ErrorBox message={error} />}

      {loading ? (
        <Spinner message="Loading contributor profiles..." />
      ) : contributors.length === 0 ? (
        <div className="bg-white p-6 rounded-2xl shadow text-gray-500">
          No contributor profiles found.
        </div>
      ) : (
        <div className="bg-white shadow rounded-2xl overflow-hidden">
          <table className="min-w-full text-left divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                  Name
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                  Email
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                  Joined
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                  Total Contributions
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                  Approved
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                  Pending
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                  Rejected
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {contributors.map((contributor) => (
                <tr key={contributor.id}>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {contributor.name}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 break-words">
                    {contributor.email}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {new Date(contributor.joinedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                    {contributor.totalSubmissions}
                  </td>
                  <td className="px-4 py-4 text-sm text-green-700">
                    {contributor.approvedSubmissions}
                  </td>
                  <td className="px-4 py-4 text-sm text-yellow-700">
                    {contributor.pendingSubmissions}
                  </td>
                  <td className="px-4 py-4 text-sm text-red-700">
                    {contributor.rejectedSubmissions}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={loadContributors}
          className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-50 text-sm font-medium"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
