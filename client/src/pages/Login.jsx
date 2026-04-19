import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import API from "../services/api";

export default function Login() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("user"); // "user" | "admin" | "contributor"
  const [form, setForm] = useState({ email: "", password: "" });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getErrorMessage = (err, fallback) => {
    const status = err?.response?.status;
    const apiError = err?.response?.data?.error;

    if (status === 429) {
      return "Too many login attempts. Please wait a bit before trying again.";
    }

    return apiError || fallback;
  };

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
      setError(getErrorMessage(err, "Login failed"));
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
      setError(getErrorMessage(err, "Google login failed"));
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-2xl ring-1 ring-black/5 md:flex">
        <div className="relative md:w-1/2 bg-linear-to-r from-sky-500 via-indigo-500 to-violet-600 text-white p-10 sm:p-12 flex flex-col justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-100">
              OPPORTUNITY MANAGEMENT PORTAL
            </h1>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight text-sky-100/95">
              Welcome Back!
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-sky-100/85">
              Track applications, deadlines, notes, and interview stages in one
              place.
            </p>
          </div>
          <div className="mt-6 text-sm text-sky-100/80">
            <p className="font-medium">
              Secure access for admins, contributors, and users.
            </p>
          </div>
        </div>

        <div className="w-full md:w-1/2 p-8 sm:p-10">
          <div className="mx-auto max-w-md">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Sign in</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setMode("user")}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    mode === "user"
                      ? "border-blue-500 bg-blue-600 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  User
                </button>
                <button
                  type="button"
                  onClick={() => setMode("admin")}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    mode === "admin"
                      ? "border-blue-500 bg-blue-600 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => setMode("contributor")}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    mode === "contributor"
                      ? "border-blue-500 bg-blue-600 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  Contributor
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 bg-red-50 text-red-700 border border-red-200 p-3 rounded-2xl text-sm">
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
                  className="mt-1 w-full border px-4 py-3 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
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
                  className="mt-1 w-full border px-4 py-3 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-2xl hover:bg-blue-700 transition disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="mt-6 flex items-center">
              <div className="flex-1 border-t border-gray-200"></div>
              <span className="px-3 text-sm text-gray-500 bg-white">or</span>
              <div className="flex-1 border-t border-gray-200"></div>
            </div>

            <div className="mt-6 flex justify-center">
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
      </div>
    </div>
  );
}
