export type DatabaseFailure = {
  code: string;
  detail: string;
};

export function describeDatabaseFailure(cause: unknown): DatabaseFailure | null {
  const messages: string[] = [];
  const codes: string[] = [];
  collect(cause, messages, codes, new Set());
  if (messages.length === 0 && codes.length === 0) {
    return null;
  }

  const blob = messages.join("\n");
  const hasCode = (code: string) => codes.includes(code);

  const table = blob.match(/relation "([^"]+)" does not exist/i)?.[1];
  if (hasCode("42P01") || table) {
    return {
      code: "schema_missing",
      detail: `Table ${table ?? "unknown"} is missing. Postgres answers but migrations were not applied.`,
    };
  }

  const database = blob.match(/database "([^"]+)" does not exist/i)?.[1];
  if (hasCode("3D000") || database) {
    return {
      code: "database_missing",
      detail: `Database ${database ?? "unknown"} does not exist.`,
    };
  }

  if (hasCode("28P01") || /password authentication failed/i.test(blob)) {
    return {
      code: "postgres_auth_failed",
      detail: "Postgres rejected DATABASE_URL credentials.",
    };
  }

  if (hasCode("ECONNREFUSED") || /ECONNREFUSED/i.test(blob)) {
    return {
      code: "postgres_refused",
      detail: "Postgres refused the connection. Is the postgres service up?",
    };
  }

  if (
    hasCode("ENOTFOUND") ||
    hasCode("EAI_AGAIN") ||
    /ENOTFOUND|getaddrinfo/i.test(blob)
  ) {
    return {
      code: "postgres_host_not_found",
      detail: "Postgres host was not found. Check DATABASE_URL.",
    };
  }

  if (hasCode("ETIMEDOUT") || hasCode("57P03") || /ETIMEDOUT/i.test(blob)) {
    return {
      code: "postgres_timeout",
      detail: "Postgres did not answer in time.",
    };
  }

  return null;
}

function collect(
  cause: unknown,
  messages: string[],
  codes: string[],
  seen: Set<object>,
): void {
  if (cause && typeof cause === "object") {
    if (seen.has(cause)) {
      return;
    }
    seen.add(cause);
  }

  const error = asErrorLike(cause);
  if (error) {
    messages.push(error.message);
    if (error.code) {
      codes.push(error.code);
    }
  }

  if (cause instanceof Error && cause.cause !== undefined) {
    collect(cause.cause, messages, codes, seen);
  }
}

function asErrorLike(
  cause: unknown,
): { code?: string; message: string } | null {
  if (cause instanceof Error) {
    const code = "code" in cause ? cause.code : undefined;
    return {
      code: typeof code === "string" ? code : undefined,
      message: cause.message,
    };
  }
  if (typeof cause === "string" && cause.length > 0) {
    return { message: cause };
  }
  if (cause && typeof cause === "object" && "message" in cause) {
    const message = (cause as { message: unknown }).message;
    const code = (cause as { code?: unknown }).code;
    if (typeof message === "string") {
      return {
        code: typeof code === "string" ? code : undefined,
        message,
      };
    }
  }
  return null;
}
