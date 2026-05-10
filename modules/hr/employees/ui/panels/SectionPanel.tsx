export function SectionPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-darktext">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

