import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { AppwriteException, ExecutionMethod } from "node-appwrite";
import { createSessionClient } from "./appwrite";
import { createAccountInput, updateAccountInput } from "./validation";

const SESSION_COOKIE = "appwrite_session";
const FUNCTION_PATH = "/personal-account";

export type PersonalRole = "property_owner" | "realtor";

export type PersonalAccount = {
    personalAccountId: string;
    firstName: string;
    lastName: string;
    role: PersonalRole;
    contactEmail: string | null;
    bio: string | null;
    createdAt: string;
    updatedAt: string;
};

export type CreatePersonalAccountInput = {
    firstName: string;
    lastName: string;
    role: PersonalRole;
};

export type UpdatePersonalAccountInput = {
    firstName?: string;
    lastName?: string;
    contactEmail?: string | null;
    bio?: string | null;
};

type FunctionErrorBody = {
    error: string;
    message: string;
    issues?: Array<{ field: string; message: string }>;
};

function functionId() {
    return process.env.APPWRITE_FUNCTION_ID ?? "personal-account";
}

function parseBody(responseBody: string): unknown {
    if (!responseBody) return null;
    try {
        return JSON.parse(responseBody);
    } catch {
        return null;
    }
}

const UNAVAILABLE = "Something went wrong on our side. Please try again.";

/** What the person sees. Function details only go to the server log. */
function userMessage(status: number, code: string | undefined): string {
    if (status === 401) return "Your session has ended. Please sign in again.";
    if (code === "personal_account_inconsistent") {
        return "You already have an account with a different role.";
    }
    if (status === 404) return "Finish creating your account first.";
    if (code === "invalid_request") {
        return "Some fields are not valid. Check them and try again.";
    }
    return UNAVAILABLE;
}

function errorFromBody(status: number, parsed: unknown): Error {
    const body = parsed as FunctionErrorBody | null;
    const code = body?.error;

    if (status >= 500 || code === undefined) {
        console.error(
            `[personal-account] Function answered ${status}:`,
            body ?? "(no body)",
        );
    }

    const error = new Error(userMessage(status, code)) as Error & {
        status?: number;
        code?: string;
    };
    error.status = status;
    error.code = code ?? "internal_error";
    return error;
}

async function execute(
    method: ExecutionMethod,
    body?: Record<string, unknown>,
): Promise<{ status: number; data: unknown }> {
    const sessionSecret = getCookie(SESSION_COOKIE);
    if (!sessionSecret) {
        throw errorFromBody(401, {
            error: "unauthorized",
            message: "No authenticated principal.",
        });
    }

    const { functions } = createSessionClient(sessionSecret);

    let execution;
    try {
        execution = await functions.createExecution({
            functionId: functionId(),
            method,
            xpath: FUNCTION_PATH,
            body: body === undefined ? undefined : JSON.stringify(body),
            async: false,
            headers:
                body === undefined
                    ? undefined
                    : { "Content-Type": "application/json" },
        });
    } catch (err) {
        // Most often the Function is not deployed or APPWRITE_FUNCTION_ID is
        // wrong; the log says which, the person gets a plain message.
        console.error(
            `[personal-account] Could not execute Function "${functionId()}":`,
            err instanceof AppwriteException
                ? `${err.code} ${err.type}: ${err.message}`
                : err,
        );
        throw new Error(UNAVAILABLE);
    }

    return {
        status: execution.responseStatusCode,
        data: parseBody(execution.responseBody),
    };
}

/** GET /personal-account — account or null when the caller has none (404). */
export const getPersonalAccountFn = createServerFn({ method: "GET" }).handler(
    async () => {
        const sessionSecret = getCookie(SESSION_COOKIE);
        if (!sessionSecret) return null;

        const { status, data } = await execute(ExecutionMethod.GET);

        if (status === 404) return null;
        if (status >= 200 && status < 300) {
            return data as PersonalAccount;
        }

        throw errorFromBody(status, data);
    },
);

/** POST /personal-account — create (or idempotent 200 if it already exists). */
export const createPersonalAccountFn = createServerFn({ method: "POST" })
    .validator(createAccountInput)
    .handler(async ({ data }) => {
        const { status, data: body } = await execute(ExecutionMethod.POST, {
            firstName: data.firstName,
            lastName: data.lastName,
            role: data.role,
        });

        if (status >= 200 && status < 300) {
            return body as PersonalAccount;
        }

        throw errorFromBody(status, body);
    });

/**
 * PATCH /personal-account — partial update.
 * Omitted fields stay; null clears optional contactEmail / bio.
 * Caller identity comes from the session, not the body.
 */
export const updatePersonalAccountFn = createServerFn({ method: "POST" })
    .validator(updateAccountInput)
    .handler(async ({ data }) => {
        const { status, data: body } = await execute(
            ExecutionMethod.PATCH,
            data as Record<string, unknown>,
        );

        if (status >= 200 && status < 300) {
            return body as PersonalAccount;
        }

        throw errorFromBody(status, body);
    });
