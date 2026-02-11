export default function StatCard({ title, value, color }) {
  return (
    <div className="bg-white shadow-md rounded-2xl p-6 hover:shadow-lg transition">
      <h3 className="text-gray-500 text-sm">{title}</h3>
      <p className={`text-3xl font-bold mt-2 ${color}`}>
        {value}
      </p>
    </div>
  );
}
