export default function OperationsLoading() {
  return (
    <div className="page-wrapper animate-pulse space-y-4">
      <div className="h-10 w-64 rounded-lg bg-gray-200" />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-24 rounded-xl bg-gray-100" />
        <div className="h-24 rounded-xl bg-gray-100" />
        <div className="h-24 rounded-xl bg-gray-100" />
      </div>
    </div>
  );
}
