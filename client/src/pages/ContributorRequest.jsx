import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import API from "../services/api";
import Spinner from "../components/common/Spinner";
import ErrorBox from "../components/common/ErrorBox";

export default function ContributorRequest() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({ linkedInUrl: "", reason: "" });
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchLatestRequest = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/contributor-requests/me");
      setRequest(res.data);
    } catch (err) {
      if (err?.response?.status === 404) {
        setRequest(null);
      } else {
        setError(err?.response?.data?.error || "Failed to load request status");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestRequest();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateForm = () => {
    if (!form.linkedInUrl.trim()) {
      return "LinkedIn profile URL is required.";
    }
    if (
      !/^https?:\/\/(www\.)?linkedin\.com\/.+/i.test(form.linkedInUrl.trim())
    ) {
      return "Please enter a valid LinkedIn profile URL.";
    }
    if (!form.reason.trim()) {
      return "Please describe your experience or why you want contributor access.";
    }
    if (form.reason.trim().length < 20) {
      return "Please provide a slightly longer reason so admins can evaluate your request.";
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationMessage = validateForm();
    if (validationMessage) {
      return setError(validationMessage);
    }

    if (request?.status === "Pending") {
      return setError("You already have a pending request.");
    }

    setSaving(true);
    try {
      const res = await API.post("/contributor-requests", {
        linkedInUrl: form.linkedInUrl.trim(),
        reason: form.reason.trim(),
      });
      setRequest(res.data);
      setSuccess(
        "Your contributor request has been submitted. Admins will review it soon.",
      );
      setForm({ linkedInUrl: "", reason: "" });
      // Redirect to dashboard to see pending status
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to submit request.");
    } finally {
      setSaving(false);
    }
  };

  const isPending = request?.status === "Pending";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Request Contributor Access
          </h1>
          <p className="text-gray-600 mt-1">
            Share your LinkedIn profile and experience so admins can review your
            request.
          </p>
        </div>
      </div>

      {loading ? (
        <Spinner message="Loading your request status..." />
      ) : (
        <div className="space-y-6">
          {error && <ErrorBox message={error} />}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg">
              {success}
            </div>
          )}

          {request ? (
            <div className="bg-white shadow rounded-2xl border border-gray-200 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Latest Request
                  </h2>
                  <p className="text-gray-500 mt-1">
                    Submitted on{" "}
                    {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                    request.status === "Pending"
                      ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                      : request.status === "Approved"
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-red-100 text-red-700 border border-red-200"
                  }`}
                >
                  {request.status}
                </span>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">LinkedIn</p>
                  <a
                    href={request.linkedInUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block text-blue-600 hover:underline"
                  >
                    {request.linkedInUrl}
                  </a>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Reviewed by</p>
                  <p className="mt-1 text-gray-700">
                    {request.reviewedBy
                      ? request.reviewedBy
                      : "Not reviewed yet"}
                  </p>
                </div>
              </div>

              {request.reviewComment && (
                <div className="mt-5 rounded-xl bg-gray-50 border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-gray-700">
                    Admin comment
                  </p>
                  <p className="mt-2 text-gray-700 whitespace-pre-line">
                    {request.reviewComment}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg">
              No contributor request found yet. Submit your request using the
              form below.
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="bg-white shadow rounded-2xl border border-gray-200 p-6"
          >
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  value={user?.name || ""}
                  disabled
                  className="mt-1 w-full rounded-lg border bg-gray-100 px-4 py-3 text-gray-700"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  value={user?.email || ""}
                  disabled
                  className="mt-1 w-full rounded-lg border bg-gray-100 px-4 py-3 text-gray-700"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="text-sm font-medium text-gray-700">
                LinkedIn Profile URL *
              </label>
              <input
                name="linkedInUrl"
                value={form.linkedInUrl}
                onChange={handleChange}
                disabled={isPending || saving}
                className="mt-1 w-full rounded-lg border px-4 py-3"
                placeholder="https://www.linkedin.com/in/your-profile"
              />
            </div>

            <div className="mt-6">
              <label className="text-sm font-medium text-gray-700">
                Reason / Experience Summary *
              </label>
              <textarea
                name="reason"
                value={form.reason}
                onChange={handleChange}
                disabled={isPending || saving}
                rows={6}
                className="mt-1 w-full rounded-lg border px-4 py-3"
                placeholder="Tell us about your experience and why you want contributor access."
              />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                {isPending
                  ? "A pending request is already in progress. You cannot submit a second request until it is reviewed."
                  : "Normal users can request contributor access once. Admins will review your request shortly."}
              </p>
              <button
                type="submit"
                disabled={isPending || saving}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending
                  ? "Pending request submitted"
                  : saving
                    ? "Submitting..."
                    : "Submit Request"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
