# Notes

## Decisions

**Session in an HTTP-only cookie.** OTP verification creates the Appwrite session on the server and stores only `session.secret` in `appwrite_session`, expiring with the session. Browser JS never sees it or the API key. Every Appwrite call goes through a server function that reads the cookie.

**Personal Account only through the Function.** The app calls `functions.createExecution` with the caller's session, so Appwrite sets `x-appwrite-user-id`. It never touches `personal_accounts` directly.

**Layers.** Server functions in `lib/auth.ts` and `lib/personal-account.ts` are the API; there is no HTTP client, because nothing calls Appwrite from the browser. `lib/queries.ts` owns the query keys, `lib/guards.ts` the `beforeLoad` redirects, and `hooks/` the mutations with their cache updates and navigation. Pages keep only form state and markup.

**Validation at every edge.** Forms use Zod for inline messages. Server functions are public endpoints, so each parses its input again with a stricter schema: an unknown field such as `role` or a user id is rejected. The Function validates a third time. Function errors reach the person as plain messages; the details go to the server log.

**Routing.** After OTP we GET the account: 404 goes to `/onboarding` (keeping `redirect`), otherwise to `redirect` or `/profile`. A guest opening `/profile` goes to `/sign-in?redirect=/profile`.

**Header first paint.** The root loader loads the user and account into the Query cache on the server, so a hard refresh renders the first name with no "Sign in" flash.

**Current user failure.** As the brief asks, any failure deletes the cookie and shows the person as signed out.

**Role is fixed.** The profile shows it read-only and never sends it. `role` is not in the Function's PATCH schema, so it would be dropped anyway.

**Clearing optional fields.** Emptying contact email or bio sends `null`, and unchanged fields are left out of the PATCH.

**Double submit.** Onboarding and profile ignore a second submit while the first runs, using a ref because `isPending` only reaches the button on the next render. If two POSTs still race, the unique index on `appwrite_user_id` makes the second return the existing row.

## Disagreements with the brief

**"Send people to whatever page `redirect` names."** Literally, that is an open redirect. Only same-origin paths are accepted. Absolute URLs, `//host` and `/\evil.com` (which browsers read as `//evil.com`) fall back to `/profile`.

**"The profile form should send the signed-in user's id."** Not done. The Function trusts only `x-appwrite-user-id`, so a client-chosen id would be ignored at best and invite editing someone else's profile at worst.

## Setup (Appwrite CLI)

`npx appwrite login` failed: the CLI issued an 8-character device code, but the browser page accepts 6. HAUZ confirmed an API key with extra deploy scopes is fine, so I pushed with `appwrite client --key ...` and `npm run appwrite:push`.

CLI 27.3.0 still edits columns through the legacy `collections` endpoints, which need `collections.write`, a scope the Console no longer offers. I created the four columns whose types differed, and the unique index, with `appwrite tablesdb` exactly as in `appwrite.config.json`. Push then reports the tables up to date and deploys the Function. The app itself needs only the README scopes.

## If this went to production

- Delete the cookie only on a real 401, so a network blip after a laptop wakes does not sign people out.
- Map the Function's `issues` onto form fields.
- `__Host-` cookie prefix, CSRF protection for cookie-authenticated mutations, shorter sessions with refresh.
- Rate-limit OTP sends and add a resend cooldown.
- Unit tests cover the redirect check, the profile patch and the input schemas (`npm test`). Next: end-to-end tests for guest to sign-in to onboarding to profile, and for clearing an optional field.
