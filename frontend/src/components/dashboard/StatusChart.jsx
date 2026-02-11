import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Applied", value: 18 },
  { name: "Pending", value: 6 },
  { name: "Rejected", value: 8 },
  { name: "Accepted", value: 3 },
];

export default function StatusChart() {
  return (
    <div className="bg-white shadow rounded-xl p-5">
      <h2 className="text-md font-semibold mb-3">
        Status Distribution
      </h2>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              outerRadius={80}
              fill="#6366f1"
              label
            />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
