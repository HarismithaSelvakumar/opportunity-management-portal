import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import API from "../services/api";

export default function Login() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("user"); // "user" | "admin"
  const [form, setForm] = useState({ email: "", password: "" });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const subtitle = useMemo(() => {
    return mode === "admin"
      ? "Admin access: manage and verify opportunities."
      : "Track applications, deadlines, notes, and interview stages in one place.";
  }, [mode]);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const saveSessionAndGo = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    navigate("/dashboard");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/auth/login", form);

      // UI mode is just a hint; backend role is the truth.
      if (mode === "admin" && res.data.user.role !== "admin") {
        setError("This account is not an admin.");
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

      saveSessionAndGo(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || "Google login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Sign in</h2>

          {/* User/Admin toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setMode("user")}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                mode === "user" ? "bg-white shadow font-semibold" : "text-gray-600"
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

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px bg-gray-200 flex-1" />
          <div className="text-xs text-gray-400">OR</div>
          <div className="h-px bg-gray-200 flex-1" />
        </div>

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
