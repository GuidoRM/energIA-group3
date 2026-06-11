export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 md:p-8 selection:bg-primary/20">
      <main className="w-full max-w-md mx-auto">
        {children}
      </main>
    </div>
  );
}
