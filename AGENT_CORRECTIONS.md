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

## 3. Open redirect through a backslash after sign-in

The brief says to send people to whatever page `redirect` names. The agent guarded this in `resolveRedirectPath` (added in `d385d75`), but only with string checks: the value had to start with `/`, and not with `//` or contain `://`. `/\evil.com` passes all three. Browsers read `\` as `/`, so that URL becomes `//evil.com`, and a signed-in person was sent to another site.

**Fix:** reject any value containing `\`, then resolve it with `new URL()` against a fixed base and accept it only if the origin is unchanged. Absolute URLs, `//host`, `/\host` and `javascript:` all fall back to `/profile`, while normal paths such as `/profile?tab=1#x` pass through.

Commit: [`acf4be3`](https://github.com/Ruzimurod11/hauz-front/commit/acf4be3) — `fix: reject backslash and cross-origin values in the post-sign-in redirect`

The prompts from that session are in `AGENT_PROMPTS.md`.
