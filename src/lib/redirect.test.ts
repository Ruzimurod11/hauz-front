import { describe, expect, it } from "vitest";
import { resolveRedirectPath } from "./redirect";

describe("resolveRedirectPath", () => {
    it.each([
        ["/profile", "/profile"],
        ["/", "/"],
        ["/profile?tab=1#bio", "/profile?tab=1#bio"],
        ["/a/../profile", "/profile"],
    ])("keeps the same-origin path %s", (value, expected) => {
        expect(resolveRedirectPath(value)).toBe(expected);
    });

    it.each([
        ["protocol-relative", "//evil.com"],
        ["backslash, read by browsers as //", "/\\evil.com"],
        ["double backslash", "\\\\evil.com"],
        ["absolute URL", "https://evil.com/profile"],
        ["javascript URL", "javascript:alert(1)"],
        ["relative path", "profile"],
        ["empty string", ""],
    ])("falls back to /profile for a %s", (_label, value) => {
        expect(resolveRedirectPath(value)).toBe("/profile");
    });

    it("falls back to /profile when there is no redirect", () => {
        expect(resolveRedirectPath(undefined)).toBe("/profile");
    });
});
