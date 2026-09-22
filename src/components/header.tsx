import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUserFn, logoutFn } from "../lib/auth";
import "./Header.css";

export function Header() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: user } = useQuery({
        queryKey: ["currentUser"],
        queryFn: () => getCurrentUserFn(),
        staleTime: 1000 * 60,
    });

    const logoutMutation = useMutation({
        mutationFn: () => logoutFn(),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
            navigate({ to: "/sign-in" });
        },
    });

    return (
        <header className="header">
            <Link to="/" className="header-logo">
                HAUZ
            </Link>

            <nav className="header-nav">
                {user ? (
                    <div className="user-info">
                        <span className="user-name">
                            Salom, <strong>{user.name || user.email}</strong>
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
                                ? "Chiqilmoqda..."
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
