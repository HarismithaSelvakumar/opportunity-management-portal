import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function LineChartCard({ dataFromApi = [] }) {
  const data = dataFromApi.map((d) => ({
    month: d.month,
    applications: d.applications,
  }));

  return (
    <div className="bg-white shadow rounded-xl p-5">
      <h2 className="text-md font-semibold mb-3">Applications Over Time</h2>

      <div className="h-56 min-h-[14rem]">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minHeight={180}
          minWidth={0}
        >
          <LineChart data={data}>
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="applications" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
