import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import {
    updatePersonalAccountFn,
    type UpdatePersonalAccountInput,
} from "../lib/personal-account";
import { queryKeys } from "../lib/queries";

/** Sends a patch from `buildProfilePatch` and caches the updated account. */
export function useUpdateProfile() {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: (patch: UpdatePersonalAccountInput) =>
            updatePersonalAccountFn({ data: patch }),
        onSuccess: async (account) => {
            queryClient.setQueryData(queryKeys.personalAccount, account);
            await router.invalidate();
        },
    });
}
