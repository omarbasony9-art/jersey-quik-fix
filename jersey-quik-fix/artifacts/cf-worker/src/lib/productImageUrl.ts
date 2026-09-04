const CANONICAL_HOSTS = new Set(["jerseyquikfix.com", "www.jerseyquikfix.com"]);

export function isAllowedProductImageUrl(value: string): boolean {
  if (!value || value.length > 2048) return false;

  if (value.startsWith("/api/product-images/")) {
    return /^\/api\/product-images\/[A-Za-z0-9._-]+$/.test(value);
  }

  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.hash
    ) {
      return false;
    }
    if (url.hostname === "images.unsplash.com") return true;
    return (
      CANONICAL_HOSTS.has(url.hostname) &&
      /^\/api\/product-images\/[A-Za-z0-9._-]+$/.test(url.pathname)
    );
  } catch {
    return false;
  }
}

export function areAllowedProductImageUrls(values: unknown): values is string[] {
  return (
    Array.isArray(values) &&
    values.length <= 12 &&
    values.every(
      (value) => typeof value === "string" && isAllowedProductImageUrl(value),
    )
  );
}