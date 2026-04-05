import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import Spinner from "../components/common/Spinner";
import ErrorBox from "../components/common/ErrorBox";

export default function PendingContributorStatus() {
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRequest = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await API.get("/contributor-requests/me");
        setRequest(res.data);

        // If approved, redirect to contributor dashboard
        if (res.data && res.data.status === "Approved") {
          // Update local storage and context
          const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
          currentUser.role = "contributor";
          localStorage.setItem("user", JSON.stringify(currentUser));
          window.dispatchEvent(new Event("authChanged"));
          navigate("/dashboard");
          return;
        }
      } catch (err) {
        setError(err?.response?.data?.error || "Failed to load request status");
      } finally {
        setLoading(false);
      }
    };
    loadRequest();
  }, [navigate]);

  if (loading) return <Spinner message="Loading request status..." />;

  if (error) return <ErrorBox message={error} />;

  if (!request) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-white shadow rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            No Contributor Request Found
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have any pending contributor requests.
          </p>
          <Link
            to="/contributor-request"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Request Contributor Access
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case "Pending":
        return "Your contributor request is being reviewed by our administrators. We'll notify you once a decision is made.";
      case "Approved":
        return "Congratulations! Your contributor request has been approved. You now have access to contributor features.";
      case "Rejected":
        return "Unfortunately, your contributor request was not approved at this time. You can submit a new request if you'd like.";
      default:
        return "Request status unknown.";
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <div className="bg-white shadow rounded-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Contributor Request Status
          </h1>
          <div className="flex justify-center">
            <span
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                request.status
              )}`}
            >
              {request.status}
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Request Details
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Submitted:</span>
                <div className="text-sm text-gray-900">
                  {new Date(request.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500">LinkedIn:</span>
                <div className="text-sm text-gray-900">
                  <a
                    href={request.linkedInUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View Profile
                  </a>
                </div>
              </div>
              {request.college && (
                <div>
                  <span className="text-sm text-gray-500">College:</span>
                  <div className="text-sm text-gray-900">{request.college}</div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reason for Request
            </h3>
            <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
              {request.reason}
            </p>
          </div>
        </div>

        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Status Update
          </h3>
          <p className="text-gray-700">{getStatusMessage(request.status)}</p>

          {request.status === "Pending" && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                While you wait, you can still use the platform as a regular user.
                Check back later or refresh this page to see updates.
              </p>
            </div>
          )}

          {request.reviewedAt && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Reviewed on {new Date(request.reviewedAt).toLocaleDateString()}
              </div>
              {request.reviewComment && (
                <div className="mt-2">
                  <span className="text-sm text-gray-500">Admin Comment:</span>
                  <p className="text-sm text-gray-700 mt-1 bg-white p-3 rounded border">
                    {request.reviewComment}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-center space-x-4">
          {request.status === "Rejected" && (
            <Link
              to="/contributor-request"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Submit New Request
            </Link>
          )}
          <Link
            to="/opportunities"
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
          >
            Browse Opportunities
          </Link>
        </div>
      </div>
    </div>
  );
}