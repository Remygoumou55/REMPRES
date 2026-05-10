export default function VenteCrmLoading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 rounded-xl bg-gray-100" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-gray-50" />
        ))}
      </div>
      <div className="h-48 rounded-2xl bg-gray-50" />
    </div>
  );
}
