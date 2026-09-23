import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loadCurrentUser } from "../lib/current-user";
import {
    getPersonalAccountFn,
    updatePersonalAccountFn,
    type PersonalAccount,
} from "../lib/personal-account";
import { fieldErrorsFromZod, profileSchema } from "../lib/validation";
import { FormTextInput } from "../components/form-text-input";
import "../styles/forms.css";

export const Route = createFileRoute("/profile")({
    beforeLoad: async ({ context }) => {
        const user = await loadCurrentUser(context.queryClient);

        if (!user) {
            throw redirect({
                to: "/sign-in",
                search: { redirect: "/profile" },
            });
        }

        const account = await context.queryClient.query({
            queryKey: ["personalAccount"],
            queryFn: () => getPersonalAccountFn(),
            staleTime: "static",
        });

        if (!account) {
            throw redirect({
                to: "/onboarding",
                search: { redirect: "/profile" },
            });
        }

        return { account };
    },
    component: ProfilePage,
});

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

const MIN_SAVING_MS = 1000;

function ProfilePage() {
    const { account: loaded } = Route.useRouteContext();
    const queryClient = useQueryClient();
    const router = useRouter();

    const [account, setAccount] = useState<PersonalAccount>(loaded);
    const [firstName, setFirstName] = useState(loaded.firstName);
    const [lastName, setLastName] = useState(loaded.lastName);
    const [contactEmail, setContactEmail] = useState(loaded.contactEmail ?? "");
    const [bio, setBio] = useState(loaded.bio ?? "");
    const [saved, setSaved] = useState(false);
    const saveInFlight = useRef(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!saved) return;
        const timer = window.setTimeout(() => setSaved(false), 2000);
        return () => window.clearTimeout(timer);
    }, [saved]);

    const updateMutation = useMutation({
        mutationFn: (values: {
            firstName: string;
            lastName: string;
            contactEmail: string;
            bio: string;
        }): Promise<PersonalAccount> => {
            const patch: {
                firstName?: string;
                lastName?: string;
                contactEmail?: string | null;
                bio?: string | null;
            } = {};

            if (values.firstName !== account.firstName) {
                patch.firstName = values.firstName;
            }
            if (values.lastName !== account.lastName) {
                patch.lastName = values.lastName;
            }

            const emailPatch = optionalFieldForPatch(
                account.contactEmail,
                values.contactEmail,
            );
            if (emailPatch !== undefined) {
                patch.contactEmail = emailPatch;
            }

            const bioPatch = optionalFieldForPatch(account.bio, values.bio);
            if (bioPatch !== undefined) {
                patch.bio = bioPatch;
            }

            const request =
                Object.keys(patch).length === 0
                    ? Promise.resolve(account)
                    : updatePersonalAccountFn({ data: patch });

            // Keep "Saving..." on screen long enough to notice, even when the
            // PATCH answers in a few hundred milliseconds.
            return Promise.all([
                request,
                new Promise((resolve) => setTimeout(resolve, MIN_SAVING_MS)),
            ]).then(([next]) => next);
        },
        onSuccess: async (next: PersonalAccount) => {
            setAccount(next);
            queryClient.setQueryData(["personalAccount"], next);
            await router.invalidate();
            setFirstName(next.firstName);
            setLastName(next.lastName);
            setContactEmail(next.contactEmail ?? "");
            setBio(next.bio ?? "");
            setSaved(true);
        },
    });

    const clearFieldError = (key: string) => {
        setFieldErrors((prev) => {
            if (!prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        // isPending only reaches the button on the next render, so a fast
        // second click would otherwise send a second PATCH.
        if (saveInFlight.current) return;

        setSaved(false);

        const parsed = profileSchema.safeParse({
            firstName,
            lastName,
            contactEmail,
            bio,
        });
        if (!parsed.success) {
            setFieldErrors(fieldErrorsFromZod(parsed.error));
            return;
        }

        setFieldErrors({});
        saveInFlight.current = true;
        updateMutation.mutate(parsed.data, {
            onSettled: () => {
                saveInFlight.current = false;
            },
        });
    };

    return (
        <div className="form-panel form-panel--wide">
            <h2>Profile</h2>
            <p className="form-meta">
                Role:{" "}
                <strong>
                    {account.role === "realtor" ? "Realtor" : "Property Owner"}
                </strong>{" "}
                (cannot be changed)
            </p>

            {updateMutation.error && (
                <div className="form-error">
                    {updateMutation.error instanceof Error
                        ? updateMutation.error.message
                        : "Something went wrong"}
                </div>
            )}

            {saved && !updateMutation.isPending && (
                <div className="form-success">Saved.</div>
            )}

            <form noValidate onSubmit={handleSubmit}>
                <div className="form-field">
                    <label className="form-label" htmlFor="profile-first-name">
                        First name
                        <span className="form-required" aria-hidden="true">
                            *
                        </span>
                    </label>
                    <FormTextInput
                        id="profile-first-name"
                        value={firstName}
                        invalid={!!fieldErrors.firstName}
                        onValueChange={(value) => {
                            setFirstName(value);
                            clearFieldError("firstName");
                        }}
                        autoComplete="given-name"
                    />
                    {fieldErrors.firstName && (
                        <p className="form-field-error">
                            {fieldErrors.firstName}
                        </p>
                    )}
                </div>

                <div className="form-field">
                    <label className="form-label" htmlFor="profile-last-name">
                        Last name
                        <span className="form-required" aria-hidden="true">
                            *
                        </span>
                    </label>
                    <FormTextInput
                        id="profile-last-name"
                        value={lastName}
                        invalid={!!fieldErrors.lastName}
                        onValueChange={(value) => {
                            setLastName(value);
                            clearFieldError("lastName");
                        }}
                        autoComplete="family-name"
                    />
                    {fieldErrors.lastName && (
                        <p className="form-field-error">
                            {fieldErrors.lastName}
                        </p>
                    )}
                </div>

                <div className="form-field">
                    <label
                        className="form-label"
                        htmlFor="profile-contact-email"
                    >
                        Contact email (optional)
                    </label>
                    <FormTextInput
                        id="profile-contact-email"
                        type="email"
                        value={contactEmail}
                        invalid={!!fieldErrors.contactEmail}
                        onValueChange={(value) => {
                            setContactEmail(value);
                            clearFieldError("contactEmail");
                        }}
                        placeholder="Leave blank to clear"
                        autoComplete="email"
                    />
                    {fieldErrors.contactEmail && (
                        <p className="form-field-error">
                            {fieldErrors.contactEmail}
                        </p>
                    )}
                </div>

                <div className="form-field form-field--last">
                    <label className="form-label" htmlFor="profile-bio">
                        Bio (optional)
                    </label>
                    <textarea
                        id="profile-bio"
                        className={`form-input${fieldErrors.bio ? " form-input--invalid" : ""}`}
                        value={bio}
                        onChange={(e) => {
                            setBio(e.target.value);
                            clearFieldError("bio");
                        }}
                        rows={4}
                        placeholder="Leave blank to clear"
                    />
                    {fieldErrors.bio && (
                        <p className="form-field-error">{fieldErrors.bio}</p>
                    )}
                </div>

                <button
                    className="form-button"
                    type="submit"
                    disabled={updateMutation.isPending}
                >
                    {updateMutation.isPending ? "Saving..." : "Save"}
                </button>
            </form>
        </div>
    );
}
