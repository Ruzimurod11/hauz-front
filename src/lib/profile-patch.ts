import type {
    PersonalAccount,
    UpdatePersonalAccountInput,
} from "./personal-account";

export type ProfileFormValues = {
    firstName: string;
    lastName: string;
    contactEmail: string;
    bio: string;
};

/** `undefined` leaves the stored value alone, `null` clears it. */
function optionalFieldForPatch(
    current: string | null,
    next: string,
): string | null | undefined {
    const trimmed = next.trim();
    if (trimmed === "") {
        return current === null ? undefined : null;
    }
    if (trimmed === (current ?? "")) {
        return undefined;
    }
    return trimmed;
}

/**
 * Only the fields that changed. The Function keeps omitted fields, so an
 * empty result means there is nothing to save.
 */
export function buildProfilePatch(
    current: PersonalAccount,
    values: ProfileFormValues,
): UpdatePersonalAccountInput {
    const patch: UpdatePersonalAccountInput = {};

    if (values.firstName !== current.firstName) {
        patch.firstName = values.firstName;
    }
    if (values.lastName !== current.lastName) {
        patch.lastName = values.lastName;
    }

    const contactEmail = optionalFieldForPatch(
        current.contactEmail,
        values.contactEmail,
    );
    if (contactEmail !== undefined) {
        patch.contactEmail = contactEmail;
    }

    const bio = optionalFieldForPatch(current.bio, values.bio);
    if (bio !== undefined) {
        patch.bio = bio;
    }

    return patch;
}
