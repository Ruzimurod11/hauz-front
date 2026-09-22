import { createServerFn } from "@tanstack/react-start";
import { createAdminClient, createSessionClient } from "./appwrite";
import { setCookie, getCookie, deleteCookie } from "@tanstack/react-start/server";
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
        setCookie(SESSION_COOKIE, session.secret, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
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
            // Xatolik bo'lsa (masalan sessiya eskirgan) cookie'ni o'chiramiz
            deleteCookie(SESSION_COOKIE);
            return null;
        }
    },
);
