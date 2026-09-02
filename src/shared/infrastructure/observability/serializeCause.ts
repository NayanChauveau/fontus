export type SerializedCause = {
  message: string;
  name?: string;
  stack?: string;
  chain: string[];
};

export function serializeCause(cause: unknown): SerializedCause {
  if (cause instanceof Error) {
    const chain = walkCauseChain(cause);
    return {
      message: cause.message,
      name: cause.name,
      stack: cause.stack,
      chain,
    };
  }
  if (cause === undefined || cause === null) {
    return { message: "unknown", chain: [] };
  }
  return { message: String(cause), chain: [String(cause)] };
}

function walkCauseChain(error: Error): string[] {
  const chain: string[] = [];
  const seen = new Set<Error>();
  let current: unknown = error;
  while (current instanceof Error && !seen.has(current)) {
    seen.add(current);
    chain.push(
      current.name === "Error"
        ? current.message
        : `${current.name}: ${current.message}`,
    );
    current = current.cause;
  }
  if (current !== undefined && current !== null && !(current instanceof Error)) {
    chain.push(String(current));
  }
  return chain;
}
