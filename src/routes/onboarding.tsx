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
import "../styles/forms.css";

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
        <div className="form-panel">
            <h2>Create your account</h2>
            <p className="form-hint">
                Tell us who you are so we can set up your HAUZ profile.
            </p>

            {createMutation.error && (
                <div className="form-error">
                    {createMutation.error instanceof Error
                        ? createMutation.error.message
                        : "Something went wrong"}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-field">
                    <label className="form-label">First name</label>
                    <input
                        className="form-input"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                    />
                </div>

                <div className="form-field">
                    <label className="form-label">Last name</label>
                    <input
                        className="form-input"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                    />
                </div>

                <fieldset className="form-fieldset">
                    <legend className="form-legend">Role</legend>
                    <label className="form-radio">
                        <input
                            type="radio"
                            name="role"
                            value="property_owner"
                            checked={role === "property_owner"}
                            onChange={() => setRole("property_owner")}
                        />{" "}
                        Property Owner
                    </label>
                    <label className="form-radio">
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
                    className="form-button"
                    type="submit"
                    disabled={createMutation.isPending}
                >
                    {createMutation.isPending ? "Saving..." : "Continue"}
                </button>
            </form>
        </div>
    );
}
