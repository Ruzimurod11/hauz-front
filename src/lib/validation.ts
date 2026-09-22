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
