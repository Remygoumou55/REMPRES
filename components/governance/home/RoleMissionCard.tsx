type RoleMissionCardProps = {
  mission: string;
};

export function RoleMissionCard({ mission }: RoleMissionCardProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">Mission du role</h2>
      <p className="mt-2 text-sm text-gray-600">{mission}</p>
    </section>
  );
}
