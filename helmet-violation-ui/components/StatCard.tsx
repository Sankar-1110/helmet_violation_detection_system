export function StatCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded shadow p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className="text-2xl font-semibold">{value}</h2>
    </div>
  );
}
