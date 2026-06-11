export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 p-6">
      <div className="flex w-full flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Energy Optimizer</h1>
          <p className="text-sm text-muted-foreground">PyMEs Fueguinas</p>
        </div>
        {children}
      </div>
    </div>
  );
}
