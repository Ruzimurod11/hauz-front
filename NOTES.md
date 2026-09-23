# Notes

## Decisions

**Session secret stays in an HTTP-only cookie.** OTP verification creates the Appwrite session on the server and stores only `session.secret` in `appwrite_session`, with the same expiry as the Appwrite session. Browser JS never sees it, and the API key never leaves the server. All Appwrite Account and Function calls go through TanStack Start server functions that read that cookie.

**Personal Account only through the Function.** The web app never opens the `personal_accounts` table. Get, create and update call `functions.createExecution` with the caller's session, so Appwrite sets `x-appwrite-user-id`.

**Post-sign-in routing.** After OTP we GET the personal account. A 404 sends the person to `/onboarding`, keeping `redirect`. Otherwise they go to `redirect`, or `/profile` by default. A guest opening `/profile` goes to `/sign-in?redirect=/profile`.

**Header first paint.** The root loader loads `currentUser` and `personalAccount` into the Query cache on the server, so a hard refresh renders the first name (or the email before onboarding) with no flash of "Sign in".

**Current user failure.** As the brief asks, any failure loading the current user deletes the cookie and shows the person as signed out.

**Role is fixed.** Onboarding sets it. The profile page shows it read-only and never sends it. `role` is not in the Function's PATCH schema, so a request that includes it has the field dropped.

**Clearing optional fields.** Emptying contact email or bio sends `null`, which the Function stores as a removed value. Unchanged fields are left out of the PATCH.

**Double submit.** Onboarding's Continue is disabled while the request runs. The unique index on `appwrite_user_id` still makes a raced second POST return the existing row. Profile Save has the same guard.

**Validation.** Forms use Zod on the client with inline messages and required markers. The Function validates again.

## Disagreements with the brief

**"Send people to whatever page the `redirect` query parameter names."** Taken literally that is an open redirect. Only same-origin paths are accepted: absolute URLs, `//host`, and backslash tricks such as `/\evil.com` (which browsers read as `//evil.com`) fall back to `/profile`.

**"The profile form should send the signed-in user's id."** I did not do this. The Function ignores the body for identity and trusts only `x-appwrite-user-id`. A client-chosen id would be ignored at best and invite attempts to edit someone else's profile at worst. The session is enough.

## Setup (Appwrite CLI)

`npx appwrite login` did not work: the CLI issued an 8-character device code, but `https://appwrite.io/oauth2/device` accepts only 6 characters, so Continue answered "invalid or expired". I asked HAUZ, and they said either path is fine: official login, or an API key with extra scopes. I used the key (`appwrite client --key ...`, then `npm run appwrite:push`) with `databases.*`, `tables.*`, `columns.*`, `indexes.*`, `functions.*` and `rules.*` added.

CLI 27.3.0 still calls the legacy `/v1/databases/.../collections/.../attributes` endpoints to create or delete a column. Those need `collections.write`, which the current Console no longer offers. So I created the four columns whose types differed from the config (`appwrite_user_id`, `first_name`, `last_name`, `bio`) and the unique index with `appwrite tablesdb create-string-column` and `create-index`, as defined in `appwrite.config.json`. After that `npm run appwrite:push` reports the tables up to date and deploys the Function. The app itself needs only the README scopes, so the extra ones can be removed from the key.

## If this went to production

- Delete the cookie only on a real 401, and keep it on network or 5xx errors, so a laptop waking up does not sign people out.
- A shared auth and account guard instead of repeating `beforeLoad` logic in each route.
- Map the Function's `issues` onto form fields instead of one error line.
- `__Host-` cookie prefix, a CSRF strategy for cookie-authenticated mutations, and a shorter session with refresh.
- Rate-limit OTP sends and add a resend cooldown in the UI.
- End-to-end tests for guest to sign-in to onboarding to profile, and for clearing an optional field.
