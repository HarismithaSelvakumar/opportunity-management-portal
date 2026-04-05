import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Opportunities from "./pages/Opportunities";
import OpportunityDetail from "./pages/OpportunityDetail";
import Calendar from "./pages/Calendar";
import MyApplications from "./pages/MyApplications";
import AddExternalApplication from "./pages/AddExternalApplication";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

import ProtectedRoute from "./components/common/ProtectedRoute";

import DashboardRouter from "./pages/DashboardRouter";
import SubmitOpportunity from "./pages/SubmitOpportunity";
import MySubmissions from "./pages/MySubmissions";
import AdminModeration from "./pages/AdminModeration";
import AdminContributors from "./pages/AdminContributors";
import ContributorAnalytics from "./pages/ContributorAnalytics";
import AdminContributorRequests from "./pages/AdminContributorRequests";

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Any logged-in user */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardRouter />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/opportunities/:id" element={<OpportunityDetail />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/applications" element={<MyApplications />} />
          <Route
            path="/applications/external/new"
            element={<AddExternalApplication />}
          />
        </Route>
      </Route>

      {/* Contributor/Admin */}
      <Route
        element={<ProtectedRoute allowedRoles={["contributor", "admin"]} />}
      >
        <Route element={<Layout />}>
          <Route path="/submit" element={<SubmitOpportunity />} />
          <Route path="/submissions" element={<MySubmissions />} />
          <Route
            path="/contributor-analytics"
            element={<ContributorAnalytics />}
          />
        </Route>
      </Route>

      {/* Admin only */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route element={<Layout />}>
          <Route path="/moderation" element={<AdminModeration />} />
          <Route
            path="/contributor-requests"
            element={<AdminContributorRequests />}
          />
          <Route path="/contributors" element={<AdminContributors />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
