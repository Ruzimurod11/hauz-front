import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import {
    createPersonalAccountFn,
    type CreatePersonalAccountInput,
} from "../lib/personal-account";
import { queryKeys } from "../lib/queries";
import { resolveRedirectPath } from "../lib/redirect";

/** Onboarding. On success the new account is cached and the person moves on. */
export function useCreateAccount(redirect: string | undefined) {
    const queryClient = useQueryClient();
    const router = useRouter();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: (data: CreatePersonalAccountInput) =>
            createPersonalAccountFn({ data }),
        onSuccess: async (account) => {
            queryClient.setQueryData(queryKeys.personalAccount, account);
            await router.invalidate();
            void navigate({ href: resolveRedirectPath(redirect) });
        },
    });
}
