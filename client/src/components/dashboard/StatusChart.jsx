import { PieChart, Pie, Tooltip, ResponsiveContainer } from "recharts";

export default function StatusChartCard({ dataFromApi = [] }) {
  return (
    <div className="bg-white shadow rounded-xl p-5">
      <h2 className="text-md font-semibold mb-3">Status Distribution</h2>

      <div className="h-56 min-h-[14rem]">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minHeight={180}
          minWidth={0}
        >
          <PieChart>
            <Pie data={dataFromApi} dataKey="value" outerRadius={80} label />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
