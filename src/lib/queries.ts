import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { getCurrentUserFn } from "./auth";
import { getPersonalAccountFn } from "./personal-account";

export const queryKeys = {
    currentUser: ["currentUser"] as const,
    personalAccount: ["personalAccount"] as const,
};

export const currentUserQuery = queryOptions({
    queryKey: queryKeys.currentUser,
    queryFn: () => getCurrentUserFn(),
});

/** `null` means the signed-in person has not onboarded yet. */
export const personalAccountQuery = queryOptions({
    queryKey: queryKeys.personalAccount,
    queryFn: () => getPersonalAccountFn(),
});

/**
 * Route guards and loaders. `getCurrentUserFn` deletes the session cookie
 * when the user cannot be loaded, and this returns null so the page shows
 * sign-in.
 */
export async function loadCurrentUser(queryClient: QueryClient) {
    try {
        return await queryClient.query({
            ...currentUserQuery,
            staleTime: "static",
        });
    } catch {
        queryClient.setQueryData(queryKeys.currentUser, null);
        return null;
    }
}

/**
 * For loaders that must still render when the Function is unreachable, such
 * as the root layout. Treats that failure the same as "no account yet".
 */
export async function loadPersonalAccount(queryClient: QueryClient) {
    try {
        return await queryClient.query(personalAccountQuery);
    } catch {
        return null;
    }
}
