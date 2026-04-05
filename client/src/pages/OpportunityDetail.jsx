import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import API from "../services/api";
import Spinner from "../components/common/Spinner";
import ErrorBox from "../components/common/ErrorBox";

export default function OpportunityDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [opp, setOpp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const role = user?.role || "guest";
  const isUser = role === "user";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await API.get(`/opportunities/${id}`);
        setOpp(res.data);

        if (isUser) {
          const appsRes = await API.get("/applications/me");
          const apps = Array.isArray(appsRes.data) ? appsRes.data : [];

          const hasApplied = apps.some(
            (a) => a.opportunityId?._id === id || a.opportunityId === id,
          );

          setApplied(hasApplied);
        }
      } catch (err) {
        setError(err?.response?.data?.error || "Failed to load opportunity");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, isUser]);

  const handleApply = async () => {
    if (!isUser) return;

    if (applied) {
      alert("You already applied to this opportunity.");
      return;
    }

    try {
      setApplying(true);
      await API.post("/applications", { opportunityId: id });
      setApplied(true);
      alert("Applied successfully ✅");
    } catch (err) {
      alert(err?.response?.data?.error || "Apply failed");
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <Spinner message="Loading opportunity..." />;

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <ErrorBox message={error} />
        <Link
          to="/opportunities"
          className="mt-4 inline-block px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
        >
          Back to Opportunities
        </Link>
      </div>
    );
  }

  if (!opp) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-gray-500">Opportunity not found.</p>
        <Link
          to="/opportunities"
          className="mt-4 inline-block px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
        >
          Back to Opportunities
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to="/opportunities"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
      >
        ← Back to Opportunities
      </Link>

      <div className="bg-white shadow rounded-2xl p-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900">{opp.title}</h1>
            <p className="text-2xl text-gray-600 mt-2">{opp.company}</p>

            <div className="flex flex-wrap gap-3 mt-4">
              {opp.type && (
                <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                  {opp.type}
                </span>
              )}

              {opp.approvalStatus && (
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    opp.approvalStatus === "APPROVED"
                      ? "bg-green-100 text-green-700"
                      : opp.approvalStatus === "PENDING"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {opp.approvalStatus}
                </span>
              )}
            </div>
          </div>

          {isUser && (
            <button
              onClick={handleApply}
              disabled={applied || applying}
              className={`px-6 py-3 rounded-lg text-white font-medium transition whitespace-nowrap ${
                applied
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {applying ? "Applying..." : applied ? "✓ Applied" : "Apply"}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            Deadline
          </h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {opp.deadline
              ? new Date(opp.deadline).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "Not specified"}
          </p>
        </div>

        {opp.link && (
          <div className="bg-white shadow rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Application Link
            </h3>
            <a
              href={opp.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg text-blue-600 hover:text-blue-700 underline break-all mt-2 inline-block"
            >
              {opp.link}
            </a>
          </div>
        )}
      </div>

      {opp.notes && (
        <div className="bg-white shadow rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Description
          </h2>
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {opp.notes}
          </p>
        </div>
      )}

      {(role === "contributor" || role === "admin") && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Submission Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Submitted by:</span>
              <p className="font-medium text-gray-900">
                {opp.createdBy?.name || "Unknown"}
              </p>
            </div>

            <div>
              <span className="text-gray-600">Submitted on:</span>
              <p className="font-medium text-gray-900">
                {opp.createdAt
                  ? new Date(opp.createdAt).toLocaleDateString()
                  : "-"}
              </p>
            </div>

            {opp.approvalStatus === "APPROVED" && (
              <>
                <div>
                  <span className="text-gray-600">Approved by:</span>
                  <p className="font-medium text-gray-900">
                    {opp.approvedBy?.name || "Admin"}
                  </p>
                </div>

                <div>
                  <span className="text-gray-600">Approved on:</span>
                  <p className="font-medium text-gray-900">
                    {opp.approvedAt
                      ? new Date(opp.approvedAt).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
              </>
            )}

            {opp.approvalStatus === "REJECTED" && opp.rejectedReason && (
              <div className="md:col-span-2">
                <span className="text-gray-600">Rejection reason:</span>
                <p className="font-medium text-red-700">{opp.rejectedReason}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-center pb-6">
        <Link
          to="/opportunities"
          className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-900 font-medium"
        >
          Browse More
        </Link>

        {isUser && !applied && opp.link && (
          <a
            href={opp.link}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
          >
            Open Application
          </a>
        )}
      </div>
    </div>
  );
}
