// Generic error reporting — logs to console (replace with your own service if needed)
export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof console !== "undefined") {
    console.error("[App Error]", error, context);
  }
}
