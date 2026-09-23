import { createServerFn } from "@tanstack/react-start";
import { createAdminClient, createSessionClient } from "./appwrite";
import {
    setCookie,
    getCookie,
    deleteCookie,
} from "@tanstack/react-start/server";
import { ID } from "node-appwrite";
import { sendOtpInput, verifyOtpInput } from "./validation";

const SESSION_COOKIE = "appwrite_session";

/** Emails a sign-in code. New and returning people go through the same call. */
export const sendOtpFn = createServerFn({ method: "POST" })
    .validator(sendOtpInput)
    .handler(async ({ data }) => {
        const { account } = createAdminClient();
        const token = await account.createEmailToken(ID.unique(), data.email);
        return { userId: token.userId };
    });

/** Exchanges the code for a session and stores only its secret. */
export const verifyOtpFn = createServerFn({ method: "POST" })
    .validator(verifyOtpInput)
    .handler(async ({ data }) => {
        const { account } = createAdminClient();
        const session = await account.createSession(data.userId, data.secret);

        // HTTP-only, so browser JavaScript can never read the secret. Without
        // an expiry the browser treats this as a session cookie and may drop
        // it on restart or resume, even though the Appwrite session lives on.
        setCookie(SESSION_COOKIE, session.secret, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            expires: new Date(session.expire),
        });

        return { success: true };
    });

/** The signed-in Appwrite user, or null. */
export const getCurrentUserFn = createServerFn({ method: "GET" }).handler(
    async () => {
        const sessionSecret = getCookie(SESSION_COOKIE);
        if (!sessionSecret) return null;

        try {
            const { account } = createSessionClient(sessionSecret);
            const user = await account.get();
            return user;
        } catch (error) {
            // Any failure loading the user ends the session. A later request
            // must not reuse a cookie we could not verify.
            console.error("[auth] Could not load the current user:", error);
            deleteCookie(SESSION_COOKIE);
            return null;
        }
    },
);

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
    const sessionSecret = getCookie(SESSION_COOKIE);

    if (sessionSecret) {
        try {
            const { account } = createSessionClient(sessionSecret);
            await account.deleteSession("current");
        } catch (error) {
            // The cookie is cleared either way, so the person is signed out
            // here even if Appwrite could not end the session.
            console.error("[auth] Could not delete the session:", error);
        }
    }

    deleteCookie(SESSION_COOKIE);
    return { success: true };
});
