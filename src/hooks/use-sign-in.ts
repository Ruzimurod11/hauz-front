import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { sendOtpFn, verifyOtpFn } from "../lib/auth";
import { personalAccountQuery, queryKeys } from "../lib/queries";
import { resolveRedirectPath } from "../lib/redirect";

/**
 * Email code sign-in. After the code is accepted, someone without a Personal
 * Account goes to onboarding, everyone else to `redirect`.
 */
export function useSignIn(redirect: string | undefined) {
    const queryClient = useQueryClient();
    const router = useRouter();
    const navigate = useNavigate();

    const sendCode = useMutation({
        mutationFn: (email: string) => sendOtpFn({ data: { email } }),
    });

    const verifyCode = useMutation({
        mutationFn: (data: { userId: string; secret: string }) =>
            verifyOtpFn({ data }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: queryKeys.currentUser,
            });

            const account = await queryClient
                .fetchQuery({ ...personalAccountQuery, staleTime: 0 })
                .catch(() => null);
            queryClient.setQueryData(queryKeys.personalAccount, account);

            await router.invalidate();

            const returnTo = resolveRedirectPath(redirect);
            if (!account) {
                void navigate({
                    to: "/onboarding",
                    search: { redirect: returnTo },
                });
                return;
            }
            void navigate({ href: returnTo });
        },
    });

    return { sendCode, verifyCode };
}
