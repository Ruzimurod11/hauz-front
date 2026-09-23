import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import {
    loadCurrentUser,
    loadPersonalAccount,
    personalAccountQuery,
} from "./queries";

/**
 * Route guards for `beforeLoad`. `returnTo` must already have gone through
 * `resolveRedirectPath`.
 */

/** A signed-out visitor signs in first and comes back to `returnTo`. */
export async function requireUser(queryClient: QueryClient, returnTo: string) {
    const user = await loadCurrentUser(queryClient);
    if (!user) {
        throw redirect({ to: "/sign-in", search: { redirect: returnTo } });
    }
    return user;
}

/** Signed in and onboarded. Someone without an account onboards first. */
export async function requireAccount(
    queryClient: QueryClient,
    returnTo: string,
) {
    const user = await requireUser(queryClient, returnTo);
    const account = await queryClient.query({
        ...personalAccountQuery,
        staleTime: "static",
    });
    if (!account) {
        throw redirect({ to: "/onboarding", search: { redirect: returnTo } });
    }
    return { user, account };
}

/** Onboarding: signed in without an account. Someone who has one skips it. */
export async function requireNoAccount(
    queryClient: QueryClient,
    returnTo: string,
) {
    const user = await requireUser(queryClient, returnTo);
    if (await loadPersonalAccount(queryClient)) {
        throw redirect({ href: returnTo });
    }
    return user;
}

/** Sign-in: someone already signed in goes on as if they had just signed in. */
export async function redirectIfSignedIn(
    queryClient: QueryClient,
    returnTo: string,
) {
    if (!(await loadCurrentUser(queryClient))) return;

    if (!(await loadPersonalAccount(queryClient))) {
        throw redirect({ to: "/onboarding", search: { redirect: returnTo } });
    }
    throw redirect({ href: returnTo });
}
