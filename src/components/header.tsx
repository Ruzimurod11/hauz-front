import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUserFn, logoutFn } from "../lib/auth";
import { getPersonalAccountFn } from "../lib/personal-account";
import "./Header.css";

export function Header() {
    const navigate = useNavigate();
    const router = useRouter();
    const queryClient = useQueryClient();

    const { data: user } = useQuery({
        queryKey: ["currentUser"],
        queryFn: () => getCurrentUserFn(),
        staleTime: 1000 * 60,
    });

    const { data: personalAccount } = useQuery({
        queryKey: ["personalAccount"],
        queryFn: () => getPersonalAccountFn(),
        enabled: !!user,
        staleTime: 1000 * 60,
    });

    const logoutMutation = useMutation({
        mutationFn: () => logoutFn(),
        onSuccess: async () => {
            queryClient.setQueryData(["currentUser"], null);
            queryClient.setQueryData(["personalAccount"], null);
            await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
            await queryClient.invalidateQueries({
                queryKey: ["personalAccount"],
            });
            await router.invalidate();
            void navigate({ to: "/sign-in" });
        },
    });

    const displayName =
        personalAccount?.firstName || user?.email || "Signed in";

    return (
        <header className="header">
            <Link to="/" className="header-logo">
                HAUZ
            </Link>

            <nav className="header-nav">
                {user ? (
                    <div className="user-info">
                        <span className="user-name">
                            <strong>{displayName}</strong>
                        </span>
                        <Link to="/profile" className="nav-link">
                            Profile
                        </Link>
                        <button
                            onClick={() => logoutMutation.mutate()}
                            disabled={logoutMutation.isPending}
                            className="btn-logout"
                        >
                            {logoutMutation.isPending
                                ? "Signing out..."
                                : "Log out"}
                        </button>
                    </div>
                ) : (
                    <Link to="/sign-in" className="btn-signin">
                        Sign in
                    </Link>
                )}
            </nav>
        </header>
    );
}
