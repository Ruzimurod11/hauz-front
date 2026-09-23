import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { logoutFn } from "../lib/auth";
import { queryKeys } from "../lib/queries";

export function useLogout() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: () => logoutFn(),
        onSuccess: async () => {
            queryClient.setQueryData(queryKeys.currentUser, null);
            queryClient.setQueryData(queryKeys.personalAccount, null);
            await router.invalidate();
            void navigate({ to: "/sign-in" });
        },
    });
}
