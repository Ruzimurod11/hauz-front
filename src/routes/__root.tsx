import type { QueryClient } from "@tanstack/react-query";
import {
    HeadContent,
    Scripts,
    createRootRouteWithContext,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Header } from "#/components/header";
import {
    loadCurrentUser,
    loadPersonalAccount,
    queryKeys,
} from "#/lib/queries";

export interface RouterContext {
    queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
    loader: async ({ context }) => {
        const user = await loadCurrentUser(context.queryClient);

        if (user) {
            await loadPersonalAccount(context.queryClient);
        } else {
            context.queryClient.setQueryData(queryKeys.personalAccount, null);
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
