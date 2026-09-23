import { Client, Account, Functions } from "node-appwrite";

/** Server only: authenticated with the API key, used for OTP sign-in. */
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

/** Server only: acts as the person whose session secret is in the cookie. */
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
