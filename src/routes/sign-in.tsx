import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useSignIn } from "../hooks/use-sign-in";
import { redirectIfSignedIn } from "../lib/guards";
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
    beforeLoad: ({ context, search }) =>
        redirectIfSignedIn(
            context.queryClient,
            resolveRedirectPath(search.redirect),
        ),
    component: SignInPage,
});

function SignInPage() {
    const search = Route.useSearch();
    const { sendCode: sendOtpMutation, verifyCode: verifyOtpMutation } =
        useSignIn(search.redirect);

    const [step, setStep] = useState<"email" | "code">("email");
    const [email, setEmail] = useState("");
    const [userId, setUserId] = useState("");
    const [code, setCode] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>(
        {},
    );

    const handleSendOtp = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        const parsed = signInEmailSchema.safeParse({ email });
        if (!parsed.success) {
            setFieldErrors(fieldErrorsFromZod(parsed.error));
            return;
        }
        setFieldErrors({});
        sendOtpMutation.mutate(parsed.data.email, {
            onSuccess: (res) => {
                setUserId(res.userId);
                setStep("code");
            },
        });
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
