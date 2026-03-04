import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const TYPES = ["Job", "Internship", "Hackathon", "Scholarship"];

export default function SubmitOpportunity() {
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

    const msg = validate();
    if (msg) return setError(msg);

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        company: form.company.trim(),
        type: form.type,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        link: form.link.trim() || "",
        notes: form.notes.trim() || "",
      };

      await API.post("/opportunities/submit", payload);

      setSuccess("Submitted ✅ Waiting for admin approval");
      setTimeout(() => navigate("/submissions"), 700);
    } catch (err) {
      setError(err?.response?.data?.error || "Submit failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Submit Opportunity</h1>
          <p className="text-gray-600 mt-1">
            Your submission will be <b>PENDING</b> until an admin approves it.
          </p>
        </div>
      </div>

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

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-2xl p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-sm text-gray-700 font-medium">
              Title <span className="text-red-500">*</span>
            </label>
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
            <label className="text-sm text-gray-700 font-medium">
              Company <span className="text-red-500">*</span>
            </label>
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
            <label className="text-sm text-gray-700 font-medium">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="mt-1 w-full border px-4 py-2.5 rounded-lg bg-white"
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
              className="mt-1 w-full border px-4 py-2.5 rounded-lg"
            />
          </div>

          <div>
            <label className="text-sm text-gray-700 font-medium">Apply Link</label>
            <input
              name="link"
              value={form.link}
              onChange={handleChange}
              className="mt-1 w-full border px-4 py-2.5 rounded-lg"
              placeholder="https://company.com/apply"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="text-sm text-gray-700 font-medium">Notes</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={5}
            className="mt-1 w-full border px-4 py-2.5 rounded-lg"
            placeholder="Eligibility, skills, rounds..."
          />
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}