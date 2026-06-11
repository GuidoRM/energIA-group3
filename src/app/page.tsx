import { Button } from "@/components/ui/button";

const stack = [
  { label: "Next.js", value: "App Router · TypeScript" },
  { label: "Drizzle ORM", value: "PostgreSQL · postgres.js" },
  { label: "Tailwind 4", value: "CSS-first · design tokens" },
  { label: "Zod", value: "type-safe env" },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-10 px-6 py-16">
      <header className="space-y-4">
        <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          IATHON 2026
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Energy Optimizer
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Proyecciones de consumo energético sensibles al clima para PyMEs de
          Tierra del Fuego. Base lista para construir el frontend y el backend.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        {stack.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-border bg-card p-4 text-card-foreground"
          >
            <p className="font-semibold">{item.label}</p>
            <p className="text-sm text-muted-foreground">{item.value}</p>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap gap-3">
        <Button size="lg">Comenzar</Button>
        <Button size="lg" variant="outline">
          Ver documentación
        </Button>
      </div>
    </main>
  );
}
