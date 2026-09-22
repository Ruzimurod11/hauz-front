import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { AppwriteException, ExecutionMethod } from "node-appwrite";
import { createSessionClient } from "./appwrite";

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

function errorFromBody(status: number, parsed: unknown): Error {
    const body = parsed as FunctionErrorBody | null;
    let message =
        body?.message ??
        (status === 401
            ? "No authenticated principal."
            : "Personal account request failed.");

    // Function returns this when TablesDB throws (usually missing DB/table).
    if (
        body?.error === "internal_error" ||
        message === "Unexpected failure."
    ) {
        message =
            "Personal account storage is not ready (missing Appwrite database/table `main` / `personal_accounts`). Create it in the Console or run `npm run appwrite:push` after CLI login.";
    }

    const error = new Error(message);
    (error as Error & { status?: number; code?: string }).status = status;
    (error as Error & { status?: number; code?: string }).code =
        body?.error ?? "internal_error";
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
        if (err instanceof AppwriteException) {
            if (
                err.type === "function_not_found" ||
                /function with the requested id could not be found/i.test(
                    err.message,
                )
            ) {
                throw new Error(
                    `Appwrite Function "${functionId()}" is not deployed. Run: npx appwrite login && npm run appwrite:push`,
                );
            }
            throw new Error(err.message);
        }
        throw err;
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
    .validator((data: CreatePersonalAccountInput) => data)
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
    .validator((data: UpdatePersonalAccountInput) => data)
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
