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
import {
    fieldErrorsFromZod,
    onboardingSchema,
} from "../lib/validation";
import { FormTextInput } from "../components/form-text-input";
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
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>(
        {},
    );

    const createMutation = useMutation({
        mutationFn: (data: {
            firstName: string;
            lastName: string;
            role: PersonalRole;
        }) => createPersonalAccountFn({ data }),
        onSuccess: async (account) => {
            queryClient.setQueryData(["personalAccount"], account);
            await queryClient.invalidateQueries({
                queryKey: ["personalAccount"],
            });
            await router.invalidate();
            void navigate({ href: resolveRedirectPath(search.redirect) });
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
        if (createMutation.isPending) return;

        const parsed = onboardingSchema.safeParse({
            firstName,
            lastName,
            role,
        });
        if (!parsed.success) {
            setFieldErrors(fieldErrorsFromZod(parsed.error));
            return;
        }

        setFieldErrors({});
        createMutation.mutate(parsed.data);
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

            <form noValidate onSubmit={handleSubmit}>
                <div className="form-field">
                    <label className="form-label" htmlFor="onboarding-first-name">
                        First name
                    </label>
                    <FormTextInput
                        id="onboarding-first-name"
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
                    <label className="form-label" htmlFor="onboarding-last-name">
                        Last name
                    </label>
                    <FormTextInput
                        id="onboarding-last-name"
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

                <fieldset className="form-fieldset">
                    <legend className="form-legend">Role</legend>
                    <label className="form-radio">
                        <input
                            type="radio"
                            name="role"
                            value="property_owner"
                            checked={role === "property_owner"}
                            onChange={() => {
                                setRole("property_owner");
                                clearFieldError("role");
                            }}
                        />
                        <span>Property Owner</span>
                    </label>
                    <label className="form-radio">
                        <input
                            type="radio"
                            name="role"
                            value="realtor"
                            checked={role === "realtor"}
                            onChange={() => {
                                setRole("realtor");
                                clearFieldError("role");
                            }}
                        />
                        <span>Realtor</span>
                    </label>
                    {fieldErrors.role && (
                        <p className="form-field-error">{fieldErrors.role}</p>
                    )}
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
