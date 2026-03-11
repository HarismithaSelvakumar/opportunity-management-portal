import { useNavigate } from "react-router-dom";

export default function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50 px-4">
      <div className="max-w-md text-center">
        <div className="text-6xl font-bold text-red-600 mb-4">403</div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>

        <p className="text-gray-600 mb-6">
          You don't have permission to access this page. Your current role
          doesn't match the required access level.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => navigate("/dashboard", { replace: true })}
            className="w-full px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-medium"
          >
            Go to Dashboard
          </button>

          <button
            onClick={() => navigate("/", { replace: true })}
            className="w-full px-6 py-3 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition font-medium"
          >
            Logout
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          If you believe this is an error, contact your administrator.
        </p>
      </div>
    </div>
  );
}
