export async function fetchJson<T>(
  input: string,
  signal: AbortSignal | undefined,
): Promise<T> {
  const response = await fetch(input, { signal });
  const payload = (await response.json()) as T | { error: string };
  if (!response.ok || (payload && typeof payload === "object" && "error" in payload)) {
    throw new Error("UNAVAILABLE");
  }
  return payload as T;
}
