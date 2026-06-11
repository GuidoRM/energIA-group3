/**
 * Helper de fetch para Client Components. Las mutaciones van siempre por
 * `/api` (§7); nunca tocan la DB ni a Hermes directamente.
 */
export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (data as { error?: { message?: string } })?.error?.message ??
      `Error ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}
