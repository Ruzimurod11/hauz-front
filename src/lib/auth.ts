import { createServerFn } from "@tanstack/react-start";
import { createAdminClient, createSessionClient } from "./appwrite";
import {
    setCookie,
    getCookie,
    deleteCookie,
} from "@tanstack/react-start/server";
import { ID } from "node-appwrite";

const SESSION_COOKIE = "appwrite_session";

// 1. Emailga OTP kod yuborish
export const sendOtpFn = createServerFn({ method: "POST" })
    .validator((data: { email: string }) => data)
    .handler(async ({ data }) => {
        const { account } = createAdminClient();
        const token = await account.createEmailToken(ID.unique(), data.email);
        return { userId: token.userId };
    });

// 2. Kiritilgan OTP kodni tekshirish va Session yaratish
export const verifyOtpFn = createServerFn({ method: "POST" })
    .validator((data: { userId: string; secret: string }) => data)
    .handler(async ({ data }) => {
        const { account } = createAdminClient();
        const session = await account.createSession(data.userId, data.secret);

        // Session secret'ni xavfsiz HTTP-only Cookie'ga saqlaymiz
        // Without an expiry the browser treats this as a session cookie and may
        // drop it on restart or resume, even though the Appwrite session lives on.
        setCookie(SESSION_COOKIE, session.secret, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            expires: new Date(session.expire),
        });

        return { success: true };
    });

// 3. Joriy foydalanuvchini olish
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

// 4. Tizimdan chiqish (Logout)
export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
    const sessionSecret = getCookie(SESSION_COOKIE);

    if (sessionSecret) {
        try {
            const { account } = createSessionClient(sessionSecret);
            // Appwrite'dan joriy sessiyani o'chiramiz
            await account.deleteSession("current");
        } catch {
            // Xatolik bo'lsa ham cookie'ni o'chirishda davom etamiz
        }
    }

    // Cookie'ni o'chiramiz
    deleteCookie(SESSION_COOKIE);
    return { success: true };
});
