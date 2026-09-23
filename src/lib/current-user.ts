import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { getCurrentUserFn } from "./auth";

export const currentUserQuery = queryOptions({
    queryKey: ["currentUser"],
    queryFn: () => getCurrentUserFn(),
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
        queryClient.setQueryData(currentUserQuery.queryKey, null);
        return null;
    }
}
