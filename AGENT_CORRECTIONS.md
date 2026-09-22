# Agent mistakes I caught

Three things Cursor got wrong that I noticed and fixed. Each links to the commit.

## 1. OTP success did not refresh Header auth state

After a successful email code, the agent navigated away but left the React Query `currentUser` cache stale. The Header kept showing **Sign in** until a full reload.

**Fix:** invalidate `currentUser` (and related router state) right after OTP verification.

Commit: [`c61650c`](https://github.com/Ruzimurod11/hauz-front/commit/c61650c) — `fix: invalidate currentUser query on successful OTP verification`

## 2. Header wrong on first paint after hard refresh

The agent treated `currentUser` as a client-only query. On hard refresh the Header briefly rendered the signed-out UI (or flashed) before the session was known, which breaks the brief: it must be correct on first paint.

**Fix:** load/hydrate `currentUser` in the root route loader on the server so the first HTML paint already has the right Header state.

Commit: [`11fb14d`](https://github.com/Ruzimurod11/hauz-front/commit/11fb14d) — `fix: hydrate currentUser on SSR to eliminate header layout flash on hard refresh`

## 3. Header used Appwrite user fields instead of Personal Account first name

Early Header code showed `user.name` / `user.email` from the Appwrite Account. The brief asks for the person’s **first name** from the Personal Account (after onboarding). Email as a permanent Header label was wrong once the account exists.

**Fix:** fetch Personal Account via the Function, hydrate it with the user on SSR, and display `personalAccount.firstName` (email only as a pre-onboarding fallback).

Commit: [`d385d75`](https://github.com/Ruzimurod11/hauz-front/commit/d385d75) — `feat: add personal account onboarding and profile via Appwrite Function`

The prompts from that session are in `AGENT_PROMPTS.md`.
