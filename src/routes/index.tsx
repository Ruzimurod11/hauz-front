import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
    return (
        <main style={{ maxWidth: 560, margin: "40px auto", padding: 20 }}>
            <h1>HAUZ</h1>
            <p>
                Sign in with an email code, finish onboarding if you are new,
                then manage your profile.
            </p>
            <p>
                <Link to="/sign-in">Sign in</Link>
                {" · "}
                <Link to="/profile">Profile</Link>
            </p>
        </main>
    );
}
