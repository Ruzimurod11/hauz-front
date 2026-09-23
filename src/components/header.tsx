import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useLogout } from "../hooks/use-logout";
import { currentUserQuery, personalAccountQuery } from "../lib/queries";
import "./Header.css";

export function Header() {
    const { data: user } = useQuery({
        ...currentUserQuery,
        staleTime: 1000 * 60,
    });

    const { data: personalAccount } = useQuery({
        ...personalAccountQuery,
        enabled: !!user,
        staleTime: 1000 * 60,
    });

    const logoutMutation = useLogout();

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
