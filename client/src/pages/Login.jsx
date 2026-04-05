import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import API from "../services/api";

export default function Login() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("user"); // "user" | "admin" | "contributor"
  const [form, setForm] = useState({ email: "", password: "" });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const subtitle = useMemo(() => {
    if (mode === "admin") {
      return "Admin access: manage and verify opportunities.";
    }
    if (mode === "contributor") {
      return "Sign in with your contributor account.";
    }
    return "Track applications, deadlines, notes, and interview stages in one place.";
  }, [mode]);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
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

    try {
      const res = await API.post("/auth/login", form);

      if (mode === "admin" && res.data.user.role !== "admin") {
        setError("This account is not an admin.");
        setLoading(false);
        return;
      }

      if (mode === "contributor" && res.data.user.role !== "contributor") {
        setError("This account does not have contributor access.");
        setLoading(false);
        return;
      }

      saveSessionAndGo(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credResponse) => {
    try {
      setError("");

      const res = await API.post("/auth/google", {
        credential: credResponse.credential,
      });

      if (mode === "admin" && res.data.user.role !== "admin") {
        setError("This Google account is not an admin.");
        return;
      }

      if (mode === "contributor" && res.data.user.role !== "contributor") {
        setError("This Google account does not have contributor access.");
        return;
      }

      saveSessionAndGo(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || "Google login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Sign in</h2>

          {/* User/Admin/Contributor toggle */}
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
              onClick={() => setMode("admin")}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                mode === "admin"
                  ? "bg-white shadow font-semibold"
                  : "text-gray-600"
              }`}
            >
              Admin
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

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
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
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Google login */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Google login failed")}
          />
        </div>

        <p className="text-sm text-gray-500 mt-6 text-center">
          Don’t have an account?{" "}
          <Link to="/register" className="text-blue-600 hover:underline">
            Create one
          </Link>
        </p>

        <p className="text-xs text-gray-400 mt-3 text-center">
          Admin access is controlled by backend allowlist.
        </p>
      </div>
    </div>
  );
}
