import {
    createFileRoute,
    redirect,
    useNavigate,
    useRouter,
} from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendOtpFn, verifyOtpFn } from "../lib/auth";
import { loadCurrentUser } from "../lib/current-user";
import { getPersonalAccountFn } from "../lib/personal-account";
import { resolveRedirectPath } from "../lib/redirect";
import {
    fieldErrorsFromZod,
    signInCodeSchema,
    signInEmailSchema,
} from "../lib/validation";
import { FormTextInput } from "../components/form-text-input";
import "../styles/forms.css";

type SignInSearch = {
    redirect?: string;
};

export const Route = createFileRoute("/sign-in")({
    validateSearch: (search: Record<string, unknown>): SignInSearch => ({
        redirect:
            typeof search.redirect === "string" ? search.redirect : undefined,
    }),
    beforeLoad: async ({ context, search }) => {
        const user = await loadCurrentUser(context.queryClient);
        if (!user) return;

        await context.queryClient
            .query({
                queryKey: ["personalAccount"],
                queryFn: () => getPersonalAccountFn(),
            })
            .catch(() => {});
        const account = context.queryClient.getQueryData(["personalAccount"]);

        if (!account) {
            throw redirect({
                to: "/onboarding",
                search: { redirect: search.redirect },
            });
        }

        throw redirect({ href: resolveRedirectPath(search.redirect) });
    },
    component: SignInPage,
});

function SignInPage() {
    const navigate = useNavigate();
    const search = Route.useSearch();
    const queryClient = useQueryClient();
    const router = useRouter();

    const [step, setStep] = useState<"email" | "code">("email");
    const [email, setEmail] = useState("");
    const [userId, setUserId] = useState("");
    const [code, setCode] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>(
        {},
    );

    const sendOtpMutation = useMutation({
        mutationFn: (emailInput: string) =>
            sendOtpFn({ data: { email: emailInput } }),
        onSuccess: (res) => {
            setUserId(res.userId);
            setStep("code");
            setFieldErrors({});
        },
    });

    const verifyOtpMutation = useMutation({
        mutationFn: (data: { userId: string; secret: string }) =>
            verifyOtpFn({ data }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["currentUser"] });

            const redirectTo = resolveRedirectPath(search.redirect);

            let account = null;
            try {
                account = await getPersonalAccountFn();
                queryClient.setQueryData(["personalAccount"], account);
            } catch {
                queryClient.setQueryData(["personalAccount"], null);
            }

            await router.invalidate();

            if (!account) {
                void navigate({
                    to: "/onboarding",
                    search: { redirect: redirectTo },
                });
                return;
            }

            void navigate({ href: redirectTo });
        },
    });

    const handleSendOtp = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        const parsed = signInEmailSchema.safeParse({ email });
        if (!parsed.success) {
            setFieldErrors(fieldErrorsFromZod(parsed.error));
            return;
        }
        setFieldErrors({});
        sendOtpMutation.mutate(parsed.data.email);
    };

    const handleVerifyOtp = (e: React.SyntheticEvent) => {
        e.preventDefault();
        const parsed = signInCodeSchema.safeParse({ code });
        if (!parsed.success) {
            setFieldErrors(fieldErrorsFromZod(parsed.error));
            return;
        }
        setFieldErrors({});
        verifyOtpMutation.mutate({ userId, secret: parsed.data.code });
    };

    const error = sendOtpMutation.error || verifyOtpMutation.error;
    const isLoading = sendOtpMutation.isPending || verifyOtpMutation.isPending;

    return (
        <div className="form-panel form-panel--narrow">
            <h2>Sign In</h2>

            {error && (
                <div className="form-error">
                    {error instanceof Error
                        ? error.message
                        : "Something went wrong"}
                </div>
            )}

            {step === "email" ? (
                <form noValidate onSubmit={handleSendOtp}>
                    <div className="form-field">
                        <label className="form-label" htmlFor="sign-in-email">
                            Email
                            <span className="form-required" aria-hidden="true">
                                *
                            </span>
                        </label>
                        <FormTextInput
                            id="sign-in-email"
                            type="email"
                            value={email}
                            invalid={!!fieldErrors.email}
                            onValueChange={(value) => {
                                setEmail(value);
                                if (fieldErrors.email) {
                                    setFieldErrors((prev) => {
                                        const next = { ...prev };
                                        delete next.email;
                                        return next;
                                    });
                                }
                            }}
                            placeholder="example@hauz.uz"
                            autoComplete="email"
                        />
                        {fieldErrors.email && (
                            <p className="form-field-error">
                                {fieldErrors.email}
                            </p>
                        )}
                    </div>
                    <button
                        className="form-button"
                        type="submit"
                        disabled={isLoading}
                    >
                        {sendOtpMutation.isPending
                            ? "Sending..."
                            : "Get code"}
                    </button>
                </form>
            ) : (
                <form noValidate onSubmit={handleVerifyOtp}>
                    <p className="form-hint">
                        Enter the 6-digit code sent to <strong>{email}</strong>:
                    </p>
                    <div className="form-field">
                        <label className="form-label" htmlFor="sign-in-code">
                            Code
                            <span className="form-required" aria-hidden="true">
                                *
                            </span>
                        </label>
                        <FormTextInput
                            id="sign-in-code"
                            type="text"
                            inputMode="numeric"
                            value={code}
                            invalid={!!fieldErrors.code}
                            onValueChange={(value) => {
                                setCode(value);
                                if (fieldErrors.code) {
                                    setFieldErrors((prev) => {
                                        const next = { ...prev };
                                        delete next.code;
                                        return next;
                                    });
                                }
                            }}
                            placeholder="123456"
                            autoComplete="one-time-code"
                        />
                        {fieldErrors.code && (
                            <p className="form-field-error">
                                {fieldErrors.code}
                            </p>
                        )}
                    </div>
                    <div className="form-actions">
                        <button
                            className="form-button"
                            type="submit"
                            disabled={isLoading}
                        >
                            {verifyOtpMutation.isPending
                                ? "Checking..."
                                : "Continue"}
                        </button>
                        <button
                            className="form-button"
                            type="button"
                            onClick={() => {
                                sendOtpMutation.reset();
                                verifyOtpMutation.reset();
                                setFieldErrors({});
                                setStep("email");
                            }}
                            disabled={isLoading}
                        >
                            Back
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
