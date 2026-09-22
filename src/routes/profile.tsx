import {
    createFileRoute,
    redirect,
    useRouter,
} from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUserFn } from "../lib/auth";
import {
    getPersonalAccountFn,
    updatePersonalAccountFn,
    type PersonalAccount,
} from "../lib/personal-account";

export const Route = createFileRoute("/profile")({
    beforeLoad: async ({ context }) => {
        const user = await context.queryClient.ensureQueryData({
            queryKey: ["currentUser"],
            queryFn: () => getCurrentUserFn(),
        });

        if (!user) {
            throw redirect({
                to: "/sign-in",
                search: { redirect: "/profile" },
            });
        }

        const account = await context.queryClient.ensureQueryData({
            queryKey: ["personalAccount"],
            queryFn: () => getPersonalAccountFn(),
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

function ProfilePage() {
    const { account: loaded } = Route.useRouteContext();
    const queryClient = useQueryClient();
    const router = useRouter();

    const [account, setAccount] = useState<PersonalAccount>(loaded);
    const [firstName, setFirstName] = useState(loaded.firstName);
    const [lastName, setLastName] = useState(loaded.lastName);
    const [contactEmail, setContactEmail] = useState(
        loaded.contactEmail ?? "",
    );
    const [bio, setBio] = useState(loaded.bio ?? "");
    const [saved, setSaved] = useState(false);

    const updateMutation = useMutation({
        mutationFn: () => {
            const patch: {
                firstName?: string;
                lastName?: string;
                contactEmail?: string | null;
                bio?: string | null;
            } = {};

            const nextFirst = firstName.trim();
            const nextLast = lastName.trim();
            if (nextFirst && nextFirst !== account.firstName) {
                patch.firstName = nextFirst;
            }
            if (nextLast && nextLast !== account.lastName) {
                patch.lastName = nextLast;
            }

            const emailPatch = optionalFieldForPatch(
                account.contactEmail,
                contactEmail,
            );
            if (emailPatch !== undefined) {
                patch.contactEmail = emailPatch;
            }

            const bioPatch = optionalFieldForPatch(account.bio, bio);
            if (bioPatch !== undefined) {
                patch.bio = bioPatch;
            }

            if (Object.keys(patch).length === 0) {
                return Promise.resolve(account);
            }

            return updatePersonalAccountFn({ data: patch });
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

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaved(false);
        if (updateMutation.isPending) return;
        updateMutation.mutate();
    };

    return (
        <div
            style={{
                maxWidth: 480,
                margin: "40px auto",
                padding: 20,
                border: "1px solid #ccc",
            }}
        >
            <h2>Profile</h2>
            <p style={{ color: "#555", fontSize: 14, marginBottom: 16 }}>
                Role:{" "}
                <strong>
                    {account.role === "realtor"
                        ? "Realtor"
                        : "Property Owner"}
                </strong>{" "}
                (cannot be changed)
            </p>

            {updateMutation.error && (
                <div style={{ color: "red", marginBottom: 10 }}>
                    {updateMutation.error instanceof Error
                        ? updateMutation.error.message
                        : "Something went wrong"}
                </div>
            )}

            {saved && !updateMutation.isPending && (
                <div style={{ color: "green", marginBottom: 10 }}>Saved.</div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", marginBottom: 4 }}>
                        First name
                    </label>
                    <input
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        style={{ width: "100%", padding: 8 }}
                    />
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", marginBottom: 4 }}>
                        Last name
                    </label>
                    <input
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        style={{ width: "100%", padding: 8 }}
                    />
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", marginBottom: 4 }}>
                        Contact email (optional)
                    </label>
                    <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="Leave blank to clear"
                        style={{ width: "100%", padding: 8 }}
                    />
                </div>

                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", marginBottom: 4 }}>
                        Bio (optional)
                    </label>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        placeholder="Leave blank to clear"
                        style={{ width: "100%", padding: 8 }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    style={{ padding: "8px 16px" }}
                >
                    {updateMutation.isPending ? "Saving..." : "Save"}
                </button>
            </form>
        </div>
    );
}
