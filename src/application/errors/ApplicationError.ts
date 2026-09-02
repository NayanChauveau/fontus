export type ApplicationErrorCode =
  | "GEOCODING_UNAVAILABLE"
  | "NETWORKS_UNAVAILABLE"
  | "ANALYSES_UNAVAILABLE"
  | "PARAMETERS_UNAVAILABLE"
  | "COMPARISON_UNAVAILABLE";

export class ApplicationError extends Error {
  constructor(
    readonly code: ApplicationErrorCode,
    readonly cause?: unknown,
  ) {
    super(code);
    this.name = "ApplicationError";
  }
}

export function isApplicationError(error: unknown): error is ApplicationError {
  return error instanceof ApplicationError;
}
