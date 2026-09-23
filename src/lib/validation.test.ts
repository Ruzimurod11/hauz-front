import { describe, expect, it } from "vitest";
import {
    createAccountInput,
    sendOtpInput,
    updateAccountInput,
    verifyOtpInput,
} from "./validation";

describe("server function inputs", () => {
    it("trims and accepts a valid email", () => {
        expect(sendOtpInput.parse({ email: " a@hauz.uz " })).toEqual({
            email: "a@hauz.uz",
        });
    });

    it("rejects a malformed email", () => {
        expect(sendOtpInput.safeParse({ email: "not-an-email" }).success).toBe(
            false,
        );
    });

    it("accepts a 6-digit code and rejects anything else", () => {
        const userId = "6ab25b96000228882a72";
        expect(verifyOtpInput.safeParse({ userId, secret: "123456" }).success)
            .toBe(true);
        expect(verifyOtpInput.safeParse({ userId, secret: "12345" }).success)
            .toBe(false);
        expect(
            verifyOtpInput.safeParse({ userId: "../x", secret: "123456" })
                .success,
        ).toBe(false);
    });

    it("rejects an unknown role on create", () => {
        const result = createAccountInput.safeParse({
            firstName: "Ali",
            lastName: "Valiyev",
            role: "admin",
        });
        expect(result.success).toBe(false);
    });

    it("accepts null to clear an optional field on update", () => {
        expect(updateAccountInput.parse({ bio: null })).toEqual({ bio: null });
    });

    it("rejects role, user ids and other unknown fields on update", () => {
        expect(updateAccountInput.safeParse({ role: "realtor" }).success).toBe(
            false,
        );
        expect(
            updateAccountInput.safeParse({ firstName: "Ali", userId: "other" })
                .success,
        ).toBe(false);
    });

    it("rejects an empty update", () => {
        expect(updateAccountInput.safeParse({}).success).toBe(false);
    });
});
