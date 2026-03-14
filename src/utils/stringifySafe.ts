// A safe stringification helper to avoid no-base-to-string and template expression issues
export function stringifySafe(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      // Fallback: if object can't be stringified, return a safe placeholder
      return "[unserializable]";
    }
  }
  switch (typeof value) {
    case "string":
      return value;
    case "number":
    case "boolean":
    case "bigint":
      return String(value);
    case "symbol":
      return value.toString();
    default:
      return "";
  }
}
