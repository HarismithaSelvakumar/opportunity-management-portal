import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

export default function Register() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("user"); // "user" | "contributor"
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [contribForm, setContribForm] = useState({
    name: "",
    email: "",
    password: "",
    linkedInUrl: "",
    reason: "",
    college: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submittedRequest, setSubmittedRequest] = useState(null);

  const subtitle = useMemo(() => {
    if (mode === "contributor") {
      return "Request contributor access with LinkedIn details. You remain a normal user until approved.";
    }
    return "Track applications, deadlines, notes, and interview stages in one place.";
  }, [mode]);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleContribChange = (e) => {
    setContribForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const saveSessionAndGo = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    // Dispatch custom event so AuthContext listener updates
    window.dispatchEvent(new Event("authChanged"));
    navigate("/dashboard");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "contributor") {
      return handleContributorSubmit(e);
    }

    try {
      const res = await API.post("/auth/register", form);
      saveSessionAndGo(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || "Register failed");
    } finally {
      setLoading(false);
    }
  };

  const handleContributorSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await API.post("/auth/contributor-request", contribForm);
      setSubmittedRequest(res.data.request || null);
      setSuccess(
        res.data.message ||
          "Your contributor request has been submitted. Admins will review it shortly.",
      );
      setError("");
      setContribForm({
        name: "",
        email: "",
        password: "",
        linkedInUrl: "",
        reason: "",
        college: "",
      });
    } catch (err) {
      setError(err?.response?.data?.error || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Register</h2>

          {/* User/Contributor toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setMode("user")}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                mode === "user"
                  ? "bg-white shadow font-semibold"
                  : "text-gray-600"
              }`}
            >
              User
            </button>
            <button
              type="button"
              onClick={() => setMode("contributor")}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                mode === "contributor"
                  ? "bg-white shadow font-semibold"
                  : "text-gray-600"
              }`}
            >
              Contributor
            </button>
          </div>
        </div>

        <p className="text-gray-500 mt-2">{subtitle}</p>

        {error && (
          <div className="mt-4 bg-red-50 text-red-700 border border-red-200 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {mode === "user" ? (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm text-gray-600">Full name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your full name"
                className="mt-1 w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="mt-1 w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="mt-1 w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>
        ) : submittedRequest ? (
          <div className="mt-6 space-y-4 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Contributor Request Status
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Your request is now submitted. An administrator will review it
                  shortly.
                </p>
              </div>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                  submittedRequest.status === "Pending"
                    ? "bg-yellow-100 text-yellow-700"
                    : submittedRequest.status === "Approved"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {submittedRequest.status}
              </span>
            </div>

            {success && (
              <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-green-700">
                {success}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">LinkedIn URL</p>
                <a
                  href={submittedRequest.linkedInUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block text-blue-600 hover:underline"
                >
                  View profile
                </a>
              </div>
              <div>
                <p className="text-sm text-gray-500">Submitted</p>
                <p className="mt-2 text-gray-900">
                  {new Date(submittedRequest.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">Reason</p>
              <div className="mt-2 rounded-xl bg-gray-50 border border-gray-200 p-4 text-gray-700">
                {submittedRequest.reason}
              </div>
            </div>

            {submittedRequest.reviewComment && (
              <div>
                <p className="text-sm text-gray-500">Admin comment</p>
                <div className="mt-2 rounded-xl bg-gray-50 border border-gray-200 p-4 text-gray-700">
                  {submittedRequest.reviewComment}
                </div>
              </div>
            )}

            {submittedRequest.status === "Approved" && (
              <div className="rounded-2xl bg-green-50 border border-green-200 p-4 text-green-800">
                Your request has been approved. You now have contributor access.
                Please sign in again to use contributor pages.
              </div>
            )}
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm text-gray-600">Full name</label>
              <input
                name="name"
                value={contribForm.name}
                onChange={handleContribChange}
                placeholder="Your full name"
                className="mt-1 w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Email</label>
              <input
                type="email"
                name="email"
                value={contribForm.email}
                onChange={handleContribChange}
                placeholder="you@example.com"
                className="mt-1 w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Password</label>
              <input
                type="password"
                name="password"
                value={contribForm.password}
                onChange={handleContribChange}
                placeholder="••••••••"
                className="mt-1 w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">
                LinkedIn profile URL
              </label>
              <input
                name="linkedInUrl"
                value={contribForm.linkedInUrl}
                onChange={handleContribChange}
                placeholder="https://www.linkedin.com/in/your-profile"
                className="mt-1 w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">
                Reason for requesting access
              </label>
              <textarea
                name="reason"
                value={contribForm.reason}
                onChange={handleContribChange}
                rows={4}
                placeholder="Tell us why you want contributor access"
                className="mt-1 w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">
                College / designation (optional)
              </label>
              <input
                name="college"
                value={contribForm.college}
                onChange={handleContribChange}
                placeholder="e.g. Computer Science, Product Designer"
                className="mt-1 w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
            >
              {loading ? "Submitting request..." : "Request contributor access"}
            </button>
          </form>
        )}

        <p className="text-sm text-gray-500 mt-6 text-center">
          Already have an account?{" "}
          <Link to="/" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
