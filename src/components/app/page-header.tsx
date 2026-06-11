export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#e2e8f0] bg-white px-8 py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">{title}</h1>
        {description && (
          <p className="mt-1 text-sm font-medium text-[#64748b]">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
