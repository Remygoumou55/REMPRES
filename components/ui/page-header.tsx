type PageHeaderProps = {
  title: string;
  subtitle?: string;
  breadcrumbs?: React.ReactNode;
  actions?: React.ReactNode;
};

export function PageHeader({ title, subtitle, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 border-b border-gray-200 pb-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {breadcrumbs ? <div className="mb-2 text-xs text-gray-500">{breadcrumbs}</div> : null}
          <h1 className="text-2xl font-bold text-darktext">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
