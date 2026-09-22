/** Only allow same-origin relative paths as post-auth redirects. */
export function resolveRedirectPath(value: string | undefined): string {
    if (
        typeof value === "string" &&
        value.startsWith("/") &&
        !value.startsWith("//") &&
        !value.includes("://")
    ) {
        return value;
    }
    return "/profile";
}
