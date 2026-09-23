const FALLBACK = "/profile";
const BASE = "http://hauz.invalid";

/** Only allow same-origin relative paths as post-auth redirects. */
export function resolveRedirectPath(value: string | undefined): string {
    // Browsers read "\" as "/", so "/\evil.com" would become "//evil.com".
    if (
        typeof value !== "string" ||
        !value.startsWith("/") ||
        value.includes("\\")
    ) {
        return FALLBACK;
    }

    let url: URL;
    try {
        url = new URL(value, BASE);
    } catch {
        return FALLBACK;
    }
    if (url.origin !== BASE) return FALLBACK;

    return `${url.pathname}${url.search}${url.hash}`;
}
