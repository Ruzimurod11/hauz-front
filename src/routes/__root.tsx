import type { QueryClient } from "@tanstack/react-query";
import {
    HeadContent,
    Scripts,
    createRootRouteWithContext,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Header } from "#/components/header";
import { getCurrentUserFn } from "#/lib/auth";
import { getPersonalAccountFn } from "#/lib/personal-account";

export interface RouterContext {
    queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
    loader: async ({ context }) => {
        const user = await context.queryClient.ensureQueryData({
            queryKey: ["currentUser"],
            queryFn: () => getCurrentUserFn(),
        });

        if (user) {
            // Prefetch without throwing so a missing Function does not blank the whole app.
            await context.queryClient.prefetchQuery({
                queryKey: ["personalAccount"],
                queryFn: () => getPersonalAccountFn(),
            });
        } else {
            context.queryClient.setQueryData(["personalAccount"], null);
        }

        return { user };
    },

    head: () => ({
        meta: [
            { charSet: "utf-8" },
            {
                name: "viewport",
                content: "width=device-width, initial-scale=1",
            },
            { title: "HAUZ" },
        ],
        links: [{ rel: "stylesheet", href: appCss }],
    }),
    shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <HeadContent />
            </head>
            <body>
                <Header />
                {children}
                <Scripts />
            </body>
        </html>
    );
}
