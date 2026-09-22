import {
    createFileRoute,
    useNavigate,
    useRouter,
    useSearch,
} from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendOtpFn, verifyOtpFn } from "../lib/auth";

export const Route = createFileRoute("/sign-in")({
    component: SignInPage,
});

function SignInPage() {
    const navigate = useNavigate();
    const search = useSearch({ strict: false }) as { redirect?: string };
    const queryClient = useQueryClient();
    const router = useRouter();

    const [step, setStep] = useState<"email" | "code">("email");
    const [email, setEmail] = useState("");
    const [userId, setUserId] = useState("");
    const [code, setCode] = useState("");

    // 1. Мутация для отправки OTP
    const sendOtpMutation = useMutation({
        mutationFn: (emailInput: string) =>
            sendOtpFn({ data: { email: emailInput } }),
        onSuccess: (res) => {
            setUserId(res.userId);
            setStep("code");
        },
    });

    // 2. Мутация для проверки OTP
    const verifyOtpMutation = useMutation({
        mutationFn: (data: { userId: string; secret: string }) =>
            verifyOtpFn({ data }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
            await router.invalidate();
            const redirectTo = search.redirect || "/profile";
            navigate({ to: redirectTo });
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
                        : "Произошла ошибка"}
                </div>
            )}

            {step === "email" ? (
                <form onSubmit={handleSendOtp}>
                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: "block", marginBottom: 4 }}>
                            Email manzil:
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
                            ? "Yuborilmoqda..."
                            : "Kodni olish"}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleVerifyOtp}>
                    <p style={{ fontSize: 14, color: "#555" }}>
                        <strong>{email}</strong> manziliga yuborilgan 6 xonali
                        kodni kiriting:
                    </p>
                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: "block", marginBottom: 4 }}>
                            Tasdiqlash kodi:
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
                            ? "Tekshirilmoqda..."
                            : "Kirish"}
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
                        Orqaga
                    </button>
                </form>
            )}
        </div>
    );
}
