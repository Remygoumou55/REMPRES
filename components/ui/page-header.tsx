type PageHeaderProps = {
  title:       string;
  subtitle?:   string;
  actions?:    React.ReactNode;
};

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-gray-100 bg-white px-6 py-5 shadow-sm">
      <div>
        <h1 className="text-xl font-bold text-darktext">{title}</h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
