import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUserFn, logoutFn } from "../lib/auth";

export function Header() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Joriy foydalanuvchini olish
    const { data: user } = useQuery({
        queryKey: ["currentUser"],
        queryFn: () => getCurrentUserFn(),
        staleTime: 1000 * 60, // 1 daqiqa keshda saqlaydi
    });

    // Logout mutatsiyasi
    const logoutMutation = useMutation({
        mutationFn: () => logoutFn(),
        onSuccess: () => {
            // Keshni tozalaymiz va Sign In sahifasiga yo'naltiramiz
            queryClient.invalidateQueries({ queryKey: ["currentUser"] });
            navigate({ to: "/sign-in" });
        },
    });

    return (
        <header
            style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "16px 24px",
                background: "#f5f5f5",
                borderBottom: "1px solid #ddd",
            }}
        >
            <div>
                <Link
                    to="/"
                    style={{
                        fontWeight: "bold",
                        textDecoration: "none",
                        color: "#333",
                    }}
                >
                    HAUZ
                </Link>
            </div>

            <nav>
                {user ? (
                    <div
                        style={{
                            display: "flex",
                            gap: "16px",
                            alignItems: "center",
                        }}
                    >
                        <span>
                            Xush kelibsiz,{" "}
                            <strong>{user.name || user.email}</strong>
                        </span>
                        <Link to="/profile">Profile</Link>
                        <button
                            onClick={() => logoutMutation.mutate()}
                            disabled={logoutMutation.isPending}
                            style={{ padding: "4px 12px", cursor: "pointer" }}
                        >
                            {logoutMutation.isPending
                                ? "Chqilmoqda..."
                                : "Log out"}
                        </button>
                    </div>
                ) : (
                    <Link
                        to="/sign-in"
                        style={{ textDecoration: "none", color: "#0066cc" }}
                    >
                        Sign in
                    </Link>
                )}
            </nav>
        </header>
    );
}
