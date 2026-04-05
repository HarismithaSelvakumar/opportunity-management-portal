import { useEffect, useState } from "react";
import API from "../services/api";
import Spinner from "../components/common/Spinner";
import ErrorBox from "../components/common/ErrorBox";

export default function AdminContributorRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await API.get("/contributor-requests");
      setRequests(res.data || []);
    } catch (err) {
      setError(
        err?.response?.data?.error || "Failed to load contributor requests",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAction = async (id, action) => {
    setProcessing(true);
    setError("");
    try {
      await API.patch(`/contributor-requests/${id}/${action}`, {
        reviewComment:
          action === "reject" ? "Rejected by admin" : "Approved by admin",
      });
      await loadRequests();
    } catch (err) {
      setError(err?.response?.data?.error || `Failed to ${action} request`);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <Spinner message="Loading contributor requests..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Contributor Requests
        </h1>
        <p className="text-gray-600 mt-1">
          Review pending contributor access requests and approve or reject them.
        </p>
      </div>

      {error && <ErrorBox message={error} />}

      {requests.length === 0 ? (
        <div className="bg-white p-6 rounded-2xl shadow text-gray-500">
          No contributor requests found.
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
                  LinkedIn
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                  Reason
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                  Submitted
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {requests.map((request) => (
                <tr key={request._id}>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {request.name}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {request.email}
                  </td>
                  <td className="px-4 py-4 text-sm text-blue-600 break-words">
                    <a
                      href={request.linkedInUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      View
                    </a>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 max-w-xl break-words">
                    {request.reason}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        request.status === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : request.status === "Approved"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {request.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 text-sm space-y-2">
                    {request.status === "Pending" ? (
                      <div className="space-y-2">
                        <button
                          disabled={processing}
                          onClick={() => handleAction(request._id, "approve")}
                          className="w-full rounded-lg bg-green-600 px-3 py-2 text-white hover:bg-green-700 disabled:opacity-60"
                        >
                          Approve
                        </button>
                        <button
                          disabled={processing}
                          onClick={() => handleAction(request._id, "reject")}
                          className="w-full rounded-lg bg-red-600 px-3 py-2 text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">
                        No actions available
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        onClick={loadRequests}
        className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-50 text-sm font-medium"
      >
        Refresh
      </button>
    </div>
  );
}
