// client/src/pages/AddOpportunity.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const TYPES = ["Job", "Internship", "Hackathon", "Scholarship"];

export default function AddOpportunity() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    company: "",
    type: "Internship",
    deadline: "",
    link: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const isAdmin = user?.role === "admin";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const validate = () => {
    if (!form.title.trim()) return "Title is required";
    if (!form.company.trim()) return "Company is required";
    if (!form.type) return "Type is required";

    if (form.link && !/^https?:\/\/.+/i.test(form.link.trim())) {
      return "Apply link must start with http:// or https://";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!isAdmin) {
      setError("Admin access only. Please login with the admin account.");
      return;
    }

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        company: form.company.trim(),
        type: form.type,
        // status removed from UI (users manage status in Applications tracker)
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        link: form.link.trim() || "",
        notes: form.notes.trim() || "",
      };

      await API.post("/opportunities", payload);

      setSuccess("Opportunity added successfully ✅");
      setTimeout(() => navigate("/opportunities"), 700);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to add opportunity");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm({
      title: "",
      company: "",
      type: "Internship",
      deadline: "",
      link: "",
      notes: "",
    });
    setError("");
    setSuccess("");
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add Opportunity</h1>
          <p className="text-gray-600 mt-1">
            Admin creates opportunities. Users apply & track progress in{" "}
            <b>My Applications</b>.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/opportunities")}
            className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-50 text-sm font-medium"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-50 text-sm font-medium"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Role guard message */}
      {!isAdmin && (
        <div className="mb-4 bg-yellow-50 text-yellow-800 border border-yellow-200 p-4 rounded-xl">
          <b>Admin only:</b> You are logged in as{" "}
          <span className="font-semibold">{user?.email || "unknown"}</span>.{" "}
          Login with the admin email to add opportunities.
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="mb-4 bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 text-green-700 border border-green-200 p-4 rounded-xl">
          {success}
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow rounded-2xl p-6 md:p-8"
      >
        {/* Top section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-sm text-gray-700 font-medium">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Frontend Developer Intern"
              className="mt-1 w-full border px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Example: “Software Engineer”
            </p>
          </div>

          <div>
            <label className="text-sm text-gray-700 font-medium">
              Company <span className="text-red-500">*</span>
            </label>
            <input
              name="company"
              value={form.company}
              onChange={handleChange}
              placeholder="TechCorp"
              className="mt-1 w-full border px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Example: “Google”
            </p>
          </div>
        </div>

        {/* Middle section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
          <div>
            <label className="text-sm text-gray-700 font-medium">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="mt-1 w-full border px-4 py-2.5 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              required
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            
          </div>

          <div>
            <label className="text-sm text-gray-700 font-medium">Deadline</label>
            <input
              type="date"
              name="deadline"
              value={form.deadline}
              onChange={handleChange}
              className="mt-1 w-full border px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            
          </div>

          <div>
            <label className="text-sm text-gray-700 font-medium">Apply Link</label>
            <input
              name="link"
              value={form.link}
              onChange={handleChange}
              placeholder="https://company.com/careers/apply"
              className="mt-1 w-full border px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            
          </div>
        </div>

        {/* Notes section */}
        <div className="mt-6">
          <label className="text-sm text-gray-700 font-medium">Notes</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Eligibility, skills required, interview rounds, documents needed..."
            rows={5}
            className="mt-1 w-full border px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Admin notes visible with the opportunity.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="text-xs text-gray-500">
            <span className="font-semibold">Access rule:</span> Only accounts in{" "}
            <code className="bg-gray-100 px-1 rounded">ADMIN_EMAILS</code> can add.
          </div>

          <button
            type="submit"
            disabled={saving || !isAdmin}
            className="px-6 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60 font-medium"
          >
            {saving ? "Saving..." : "Add Opportunity"}
          </button>
        </div>
      </form>
    </div>
  );
}