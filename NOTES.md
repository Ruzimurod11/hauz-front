# Notes

## Decisions

**Session secret stays in an HTTP-only cookie.** OTP verification creates the Appwrite session on the server and stores only `session.secret` in `appwrite_session`. Browser JS never sees it, and the API key never leaves the server. All Appwrite Account and Function calls go through TanStack Start server functions that read that cookie.

**Personal Account only through the Function.** The web app never opens the `personal_accounts` table. `get` / `create` / `update` call `functions.createExecution` with the caller's session so Appwrite injects `x-appwrite-user-id`.

**Post-sign-in routing.** After OTP, we GET the personal account. 404 → `/onboarding` (keeping `redirect`). Otherwise → the `redirect` query param, default `/profile`. Guests hitting `/profile` go to `/sign-in?redirect=/profile`.

**Header first paint.** The root loader hydrates both `currentUser` and `personalAccount` into the Query cache before render, so a hard refresh shows the first name (or email before onboarding) without a flash of "Sign in".

**Onboarding double-submit.** The Continue button is disabled while the mutation is pending. The Function's unique index on `appwrite_user_id` still makes a raced double POST safe (200 with the existing row).

## Disagreements with the brief

**"The profile form should send the signed-in user's id so the Function knows whose profile to update."** I did not do this. The Function intentionally ignores the body for identity and trusts only `x-appwrite-user-id`. Sending a client-chosen user id would be ignored at best and a footgun at worst (someone could try to edit another profile). The session is enough.

## Setup workaround (Appwrite CLI device login)

README asks for `npx appwrite login` then `npm run appwrite:push`. Device authorization is currently broken on Appwrite Cloud's side: the CLI issues an **8-character** `user_code`, but `https://appwrite.io/oauth2/device` only shows a **6-character** input, truncates the code, and Continue returns "invalid or expired". That is not fixable from this repo.

I asked HAUZ, and they said either path is fine: official login, or pushing with an API key that has extra scopes. I pushed with the key (`appwrite client --key ...`, then `npm run appwrite:push`) after adding `databases.*`, `tables.*`, `columns.*`, `indexes.*`, `functions.*` and `rules.*` to it.

CLI 27.3.0 still calls the legacy `/v1/databases/.../collections/.../attributes` endpoints when it creates or deletes a column, and those need `collections.write`, a scope the current Console no longer offers. So I created the four mismatched columns (`appwrite_user_id`, `first_name`, `last_name`, `bio`) and the unique index with `appwrite tablesdb create-string-column` / `create-index`, exactly as defined in `appwrite.config.json`. After that `npm run appwrite:push` reports the tables as up to date and deploys the Function.

The app itself only needs the README scopes (`sessions.write`, `users.read`, `users.write`, `execution.write`). The extra deploy scopes can be removed from the key afterwards.

## If this went to production

- Typed redirects and a shared auth/account guard helper instead of repeating `beforeLoad` logic.
- Stronger server-fn error mapping (status + `issues` to the form).
- Cookie `Secure` + `__Host-` prefix, CSRF strategy for cookie-authed mutations, and shorter session TTL with refresh.
- Rate-limit OTP send and add resend cooldown in the UI.
- E2E coverage for guest → sign-in → onboarding → profile and clear-optional-field.
