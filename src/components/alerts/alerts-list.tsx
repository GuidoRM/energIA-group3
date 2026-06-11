"use client";

import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/client";
import type { Alert } from "@/lib/types";

const SEVERITY_VARIANT = {
  low: "secondary",
  medium: "warning",
  high: "destructive",
} as const;

const SEVERITY_LABEL = { low: "Baja", medium: "Media", high: "Alta" };

export function AlertsList({ initial }: { initial: Alert[] }) {
  const router = useRouter();

  async function markRead(id: string) {
    await apiFetch(`/api/alerts/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isRead: true }),
    });
    router.refresh();
  }

  if (initial.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay alertas. Se generan al proyectar consumos que superan el umbral.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {initial.map((a) => (
        <Card key={a.id} className={a.isRead ? "opacity-60" : undefined}>
          <CardContent className="flex items-start justify-between gap-4 pt-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant={SEVERITY_VARIANT[a.severity]}>
                  {SEVERITY_LABEL[a.severity]}
                </Badge>
                {!a.isRead && <Badge>Nueva</Badge>}
              </div>
              <p className="text-sm">{a.message}</p>
            </div>
            {!a.isRead && (
              <button
                onClick={() => markRead(a.id)}
                className="shrink-0 text-xs text-primary hover:underline"
              >
                Marcar leída
              </button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
