import { Client, Account, Functions } from "node-appwrite";

// Server uchun Appwrite Client (Secret va API Key faqat serverda ishlaydi)
export function createAdminClient() {
    const client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT!)
        .setProject(process.env.APPWRITE_PROJECT_ID!)
        .setKey(process.env.APPWRITE_API_KEY!);

    return {
        account: new Account(client),
        functions: new Functions(client),
    };
}

// Cookie'dagi session bo'yicha sorov yuboruvchi Client
export function createSessionClient(sessionSecret?: string) {
    const client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT!)
        .setProject(process.env.APPWRITE_PROJECT_ID!);

    if (sessionSecret) {
        client.setSession(sessionSecret);
    }

    return {
        account: new Account(client),
        functions: new Functions(client),
    };
}
