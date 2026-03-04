import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const TYPES = ["", "Job", "Internship", "Hackathon", "Scholarship"];
const STATUSES = ["Saved", "Applied", "Test", "Interview", "Offer", "Selected", "Rejected"];

export default function AddExternalApplication() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    company: "",
    type: "",
    deadline: "",
    link: "",
    status: "Applied",
    notes: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    if (!form.title.trim()) return "Title is required";
    if (!form.company.trim()) return "Company is required";
    if (form.link && !/^https?:\/\/.+/i.test(form.link.trim())) {
      return "Link must start with http:// or https://";
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const msg = validate();
    if (msg) return setError(msg);

    setSaving(true);
    try {
      await API.post("/applications/external", {
        title: form.title.trim(),
        company: form.company.trim(),
        type: form.type,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        link: form.link.trim(),
        status: form.status,
        notes: form.notes,
      });

      setSuccess("External application added ✅");
      setTimeout(() => navigate("/applications"), 700);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to add external application");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add External Application</h1>
          <p className="text-gray-600 mt-1">
            Add applications from LinkedIn, company portals, referrals, etc.
          </p>
        </div>

        <button
          onClick={() => navigate("/applications")}
          className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-50 text-sm font-medium"
          type="button"
        >
          Back
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl">{error}</div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 text-green-700 border border-green-200 p-4 rounded-xl">{success}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-2xl p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-sm font-medium text-gray-700">Title *</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="mt-1 w-full border px-4 py-2.5 rounded-lg"
              placeholder="Software Engineer Intern"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Company *</label>
            <input
              name="company"
              value={form.company}
              onChange={handleChange}
              className="mt-1 w-full border px-4 py-2.5 rounded-lg"
              placeholder="Google"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
          <div>
            <label className="text-sm font-medium text-gray-700">Type</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="mt-1 w-full border px-4 py-2.5 rounded-lg bg-white"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t || "—"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Deadline</label>
            <input
              type="date"
              name="deadline"
              value={form.deadline}
              onChange={handleChange}
              className="mt-1 w-full border px-4 py-2.5 rounded-lg"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="mt-1 w-full border px-4 py-2.5 rounded-lg bg-white"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6">
          <label className="text-sm font-medium text-gray-700">Link</label>
          <input
            name="link"
            value={form.link}
            onChange={handleChange}
            className="mt-1 w-full border px-4 py-2.5 rounded-lg"
            placeholder="https://..."
          />
        </div>

        <div className="mt-6">
          <label className="text-sm font-medium text-gray-700">Notes</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={5}
            className="mt-1 w-full border px-4 py-2.5 rounded-lg"
            placeholder="Interview rounds, referral name, documents, etc."
          />
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Add External Application"}
          </button>
        </div>
      </form>
    </div>
  );
}