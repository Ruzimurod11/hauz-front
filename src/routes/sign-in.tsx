import {
    createFileRoute,
    redirect,
    useNavigate,
    useRouter,
} from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUserFn, sendOtpFn, verifyOtpFn } from "../lib/auth";
import { getPersonalAccountFn } from "../lib/personal-account";
import { resolveRedirectPath } from "../lib/redirect";

type SignInSearch = {
    redirect?: string;
};

export const Route = createFileRoute("/sign-in")({
    validateSearch: (search: Record<string, unknown>): SignInSearch => ({
        redirect:
            typeof search.redirect === "string" ? search.redirect : undefined,
    }),
    beforeLoad: async ({ context, search }) => {
        const user = await context.queryClient.ensureQueryData({
            queryKey: ["currentUser"],
            queryFn: () => getCurrentUserFn(),
        });
        if (!user) return;

        // Prefetch so a Function/table outage does not blank this route.
        await context.queryClient.prefetchQuery({
            queryKey: ["personalAccount"],
            queryFn: () => getPersonalAccountFn(),
        });
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

    const sendOtpMutation = useMutation({
        mutationFn: (emailInput: string) =>
            sendOtpFn({ data: { email: emailInput } }),
        onSuccess: (res) => {
            setUserId(res.userId);
            setStep("code");
        },
    });

    const verifyOtpMutation = useMutation({
        mutationFn: (data: { userId: string; secret: string }) =>
            verifyOtpFn({ data }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["currentUser"] });

            const redirectTo = resolveRedirectPath(search.redirect);

            // OTP session is already set. Personal-account lookup can fail if
            // the Function/table is not deployed yet — still leave sign-in.
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
        sendOtpMutation.mutate(email);
    };

    const handleVerifyOtp = (e: React.SyntheticEvent) => {
        e.preventDefault();
        verifyOtpMutation.mutate({ userId, secret: code });
    };

    const error = sendOtpMutation.error || verifyOtpMutation.error;
    const isLoading = sendOtpMutation.isPending || verifyOtpMutation.isPending;

    return (
        <div
            style={{
                maxWidth: 400,
                margin: "40px auto",
                padding: 20,
                border: "1px solid #ccc",
            }}
        >
            <h2>Sign In</h2>

            {error && (
                <div style={{ color: "red", marginBottom: 10 }}>
                    {error instanceof Error
                        ? error.message
                        : "Something went wrong"}
                </div>
            )}

            {step === "email" ? (
                <form onSubmit={handleSendOtp}>
                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: "block", marginBottom: 4 }}>
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="example@hauz.uz"
                            style={{ width: "100%", padding: 8 }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{ padding: "8px 16px" }}
                    >
                        {sendOtpMutation.isPending
                            ? "Sending..."
                            : "Get code"}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleVerifyOtp}>
                    <p style={{ fontSize: 14, color: "#555" }}>
                        Enter the 6-digit code sent to <strong>{email}</strong>:
                    </p>
                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: "block", marginBottom: 4 }}>
                            Code
                        </label>
                        <input
                            type="text"
                            required
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="123456"
                            style={{ width: "100%", padding: 8 }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{ padding: "8px 16px", marginRight: 8 }}
                    >
                        {verifyOtpMutation.isPending
                            ? "Checking..."
                            : "Continue"}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            sendOtpMutation.reset();
                            verifyOtpMutation.reset();
                            setStep("email");
                        }}
                        disabled={isLoading}
                        style={{ padding: "8px 16px" }}
                    >
                        Back
                    </button>
                </form>
            )}
        </div>
    );
}
