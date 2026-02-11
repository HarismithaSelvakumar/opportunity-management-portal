import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Jan", applications: 4 },
  { month: "Feb", applications: 7 },
  { month: "Mar", applications: 5 },
  { month: "Apr", applications: 9 },
  { month: "May", applications: 6 },
  { month: "Jun", applications: 10 },
];

export default function SimpleLineChart() {
  return (
    <div className="bg-white shadow rounded-xl p-5">
      <h2 className="text-md font-semibold mb-3">
        Applications Over Time
      </h2>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="applications"
              stroke="#3b82f6"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
