import { describe, expect, it } from "vitest";
import type { PersonalAccount } from "./personal-account";
import { buildProfilePatch, type ProfileFormValues } from "./profile-patch";

const account: PersonalAccount = {
    personalAccountId: "row1",
    firstName: "Ali",
    lastName: "Valiyev",
    role: "realtor",
    contactEmail: "ali@hauz.uz",
    bio: null,
    createdAt: "2026-09-22T00:00:00.000Z",
    updatedAt: "2026-09-22T00:00:00.000Z",
};

function form(changes: Partial<ProfileFormValues> = {}): ProfileFormValues {
    return {
        firstName: account.firstName,
        lastName: account.lastName,
        contactEmail: account.contactEmail ?? "",
        bio: account.bio ?? "",
        ...changes,
    };
}

describe("buildProfilePatch", () => {
    it("sends nothing when nothing changed", () => {
        expect(buildProfilePatch(account, form())).toEqual({});
    });

    it("sends only the fields that changed", () => {
        expect(buildProfilePatch(account, form({ lastName: "Aliyev" }))).toEqual(
            { lastName: "Aliyev" },
        );
    });

    it("clears an emptied optional field with null", () => {
        expect(buildProfilePatch(account, form({ contactEmail: "" }))).toEqual({
            contactEmail: null,
        });
    });

    it("does not clear a field that is already empty", () => {
        expect(buildProfilePatch(account, form({ bio: "   " }))).toEqual({});
    });

    it("trims a new optional value", () => {
        expect(buildProfilePatch(account, form({ bio: "  Hello  " }))).toEqual({
            bio: "Hello",
        });
    });

    it("treats surrounding spaces on an unchanged value as no change", () => {
        expect(
            buildProfilePatch(account, form({ contactEmail: " ali@hauz.uz " })),
        ).toEqual({});
    });
});
