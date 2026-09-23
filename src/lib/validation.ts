import { z } from "zod";

export const signInEmailSchema = z.object({
    email: z
        .string()
        .trim()
        .min(1, "Email is required.")
        .pipe(z.email("Enter a valid email address.")),
});

export const signInCodeSchema = z.object({
    code: z
        .string()
        .trim()
        .min(1, "Code is required.")
        .regex(/^\d{6}$/, "Enter the 6-digit code."),
});

export const onboardingSchema = z.object({
    firstName: z
        .string()
        .trim()
        .min(1, "First name is required.")
        .max(100, "First name must be at most 100 characters."),
    lastName: z
        .string()
        .trim()
        .min(1, "Last name is required.")
        .max(100, "Last name must be at most 100 characters."),
    role: z.enum(["property_owner", "realtor"], {
        error: "Choose a role.",
    }),
});

export const profileSchema = z.object({
    firstName: z
        .string()
        .trim()
        .min(1, "First name is required.")
        .max(100, "First name must be at most 100 characters."),
    lastName: z
        .string()
        .trim()
        .min(1, "Last name is required.")
        .max(100, "Last name must be at most 100 characters."),
    contactEmail: z
        .string()
        .trim()
        .refine(
            (value) => value === "" || z.email().safeParse(value).success,
            "Enter a valid email address.",
        ),
    bio: z
        .string()
        .trim()
        .max(2000, "Bio must be at most 2000 characters."),
});

/*
 * Server function inputs. The form schemas above only shape the UI; a server
 * function is a public endpoint and must check whatever it is sent.
 */

export const sendOtpInput = z.object({
    email: z.string().trim().max(254).pipe(z.email()),
});

export const verifyOtpInput = z.object({
    // Appwrite user IDs: up to 36 characters of a-z, A-Z, 0-9, ".", "-", "_".
    userId: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,35}$/),
    secret: z.string().regex(/^\d{6}$/),
});

export const createAccountInput = onboardingSchema;

export const updateAccountInput = z
    .object({
        firstName: z.string().trim().min(1).max(100).optional(),
        lastName: z.string().trim().min(1).max(100).optional(),
        contactEmail: z
            .string()
            .trim()
            .max(254)
            .pipe(z.email())
            .nullable()
            .optional(),
        bio: z.string().trim().min(1).max(2000).nullable().optional(),
    })
    .strict()
    .refine((patch) => Object.keys(patch).length > 0, {
        message: "Nothing to update.",
    });

/** First Zod message per top-level field. */
export function fieldErrorsFromZod(
    error: z.ZodError,
): Record<string, string> {
    const out: Record<string, string> = {};
    for (const issue of error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && out[key] === undefined) {
            out[key] = issue.message;
        }
    }
    return out;
}
