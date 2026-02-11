import StatCard from "../components/dashboard/StatCard";
import LineChart from "../components/dashboard/LineChart";
import StatusChart from "../components/dashboard/StatusChart";

export default function Dashboard() {
  return (
    <div className="p-8 w-full bg-gray-50 min-h-screen">

      <h1 className="text-3xl font-bold mb-8 text-gray-800">
        Dashboard
      </h1>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
        <StatCard title="Total Opportunities" value="45" color="text-blue-600" />
        <StatCard title="Applied" value="18" color="text-green-600" />
        <StatCard title="Interviews" value="6" color="text-yellow-500" />
        <StatCard title="Offers" value="3" color="text-purple-600" />
        <StatCard title="Rejected" value="8" color="text-red-500" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <LineChart />
        <StatusChart />
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-white shadow-md rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Upcoming Deadlines
        </h2>

        <div className="space-y-4">
          <div className="flex justify-between border-b pb-2">
            <span>Frontend Developer - TechCorp</span>
            <span className="text-red-500">Feb 20</span>
          </div>

          <div className="flex justify-between border-b pb-2">
            <span>Data Analyst - DataDriven Co.</span>
            <span className="text-red-500">Feb 25</span>
          </div>

          <div className="flex justify-between">
            <span>Product Manager Intern - StartupXYZ</span>
            <span className="text-red-500">Mar 2</span>
          </div>
        </div>
      </div>

    </div>
  );
}
