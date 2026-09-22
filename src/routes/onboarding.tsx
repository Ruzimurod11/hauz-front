import {
    createFileRoute,
    redirect,
    useNavigate,
    useRouter,
} from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUserFn } from "../lib/auth";
import {
    createPersonalAccountFn,
    getPersonalAccountFn,
    type PersonalRole,
} from "../lib/personal-account";
import { resolveRedirectPath } from "../lib/redirect";

type OnboardingSearch = {
    redirect?: string;
};

export const Route = createFileRoute("/onboarding")({
    validateSearch: (search: Record<string, unknown>): OnboardingSearch => ({
        redirect:
            typeof search.redirect === "string" ? search.redirect : undefined,
    }),
    beforeLoad: async ({ context, search }) => {
        const user = await context.queryClient.ensureQueryData({
            queryKey: ["currentUser"],
            queryFn: () => getCurrentUserFn(),
        });

        if (!user) {
            throw redirect({
                to: "/sign-in",
                search: {
                    redirect: resolveRedirectPath(search.redirect),
                },
            });
        }

        // Cache may already hold null after a failed lookup; do not throw on 500.
        await context.queryClient.prefetchQuery({
            queryKey: ["personalAccount"],
            queryFn: () => getPersonalAccountFn(),
        });
        const account = context.queryClient.getQueryData(["personalAccount"]);

        if (account) {
            throw redirect({ href: resolveRedirectPath(search.redirect) });
        }
    },
    component: OnboardingPage,
});

function OnboardingPage() {
    const navigate = useNavigate();
    const router = useRouter();
    const search = Route.useSearch();
    const queryClient = useQueryClient();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [role, setRole] = useState<PersonalRole>("property_owner");

    const createMutation = useMutation({
        mutationFn: () =>
            createPersonalAccountFn({
                data: {
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    role,
                },
            }),
        onSuccess: async (account) => {
            queryClient.setQueryData(["personalAccount"], account);
            await queryClient.invalidateQueries({
                queryKey: ["personalAccount"],
            });
            await router.invalidate();
            void navigate({ href: resolveRedirectPath(search.redirect) });
        },
    });

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (createMutation.isPending) return;
        createMutation.mutate();
    };

    return (
        <div
            style={{
                maxWidth: 440,
                margin: "40px auto",
                padding: 20,
                border: "1px solid #ccc",
            }}
        >
            <h2>Create your account</h2>
            <p style={{ color: "#555", fontSize: 14 }}>
                Tell us who you are so we can set up your HAUZ profile.
            </p>

            {createMutation.error && (
                <div style={{ color: "red", marginBottom: 10 }}>
                    {createMutation.error instanceof Error
                        ? createMutation.error.message
                        : "Something went wrong"}
                </div>
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

                <fieldset style={{ marginBottom: 16, border: "none", padding: 0 }}>
                    <legend style={{ marginBottom: 8 }}>Role</legend>
                    <label style={{ display: "block", marginBottom: 6 }}>
                        <input
                            type="radio"
                            name="role"
                            value="property_owner"
                            checked={role === "property_owner"}
                            onChange={() => setRole("property_owner")}
                        />{" "}
                        Property Owner
                    </label>
                    <label style={{ display: "block" }}>
                        <input
                            type="radio"
                            name="role"
                            value="realtor"
                            checked={role === "realtor"}
                            onChange={() => setRole("realtor")}
                        />{" "}
                        Realtor
                    </label>
                </fieldset>

                <button
                    type="submit"
                    disabled={createMutation.isPending}
                    style={{ padding: "8px 16px" }}
                >
                    {createMutation.isPending ? "Saving..." : "Continue"}
                </button>
            </form>
        </div>
    );
}
