# Agent prompts

Shortened list of prompts from the Cursor session that built this take-home (22 Sep 2026).
Repeated errors, commit requests, and small CSS tweaks are left out. Secrets are redacted.

## 1

Study the project.

## 2

`.cursor/01-candidate-brief.pdf` also has requirements. Look at those, plan the remaining work yourself, and show me the plan.

## 3

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

## 4

I have 3 emails and I do not know which one to pick.

## 5

"That code is invalid or has expired. Check your device and try again." This shows up even when I type the correct code. The terminal shows 8 digits and the browser shows 6. They do not match.

## 6

Did the tasks or requirements say anything about `functions.read` and `functions.write`? Which approach should we prefer?

## 7

Write down exactly what blocked the official CLI login. I am going to ask HR. You are adding a lot of API key permissions on your own.

## 8

I asked them this:

Hello. During setup, `npx appwrite login` device authorization returns "invalid or expired" when I press Continue in the browser. A CLI config conflict (API key endpoint vs Cloud login) and a local `~/.appwrite` permission problem got mixed in as well. `appwrite:push` from the README cannot finish without that login. Adding `functions.*` / `databases.*` / `tables.*` to the API key is not in the brief. What should I do to follow the official CLI login path without doing that?

## 9

The CLI was configured incorrectly. The agent had set the Appwrite client to the API key plus `fra.cloud.appwrite.io`. Device login goes through `cloud.appwrite.io` / `appwrite.io`. Look this over and fix it.

## 10

There is a line that says: "You may change the Function if you need to. Explain why in NOTES.md." Based on that, can we add the key?

## 11

There is also this: "Some of these were written in a hurry. If one is wrong or unsafe, do not follow it silently. Do what you think is right and say so in NOTES.md." I think we can rely on that and do the work ourselves.

## 12

On the onboarding page the roles and first names showed up, then "Unexpected failure." I think something in the code is wrong. Can we do it this way, according to the requirements? Let's do it from the start.

## 13

String is deprecated and there is Text. Is Text the one to use?

## 14

I created the unique index. The form showed up and the name appeared in the Header. No error showed up.

## 15

Which tasks are still left? Is the spec fully done? Check it carefully again.

## 16

Move all the inline styles into external styles, the same way as the Header.

## 17

"Enter an email, get a code, enter the code, you are in. New and returning people see the same screens." Is this done?

## 18

Empty fields should not use the browser default check. Use a custom checker with Zod.

## 19

When a name is typed into the input, a clear icon should appear on the right. It should not be the browser's own clear icon.

## 20

[redacted secret]

This is still being written into the cookie, isn't it? What is this?

## 21

In another project I typed `document.cookie` in the console and this came out:

```
document.cookie
'NEXT_LOCALE=ru; access_token=[redacted token]; refresh_token=[redacted token]'
```

## 22

Is everything according to the requirements so far?

## 23

Now I need to write, in a convincing way, about 3 mistakes Cursor AI made and that I fixed.

## 24

Write a markdown file with full information about the project. Is this written in React, or is it the TanStack Start framework? I still have to defend this project.

## 25

Translate `AGENT_CORRECTIONS` into Uzbek as well, and write it out in small pieces so I can use it for the defense.

## 26

If I deploy this to Vercel now, will the APIs work? Does the brief say to deploy to Vercel?

## 27

In `functions/src` every function is given as `.js`. Ideally, shouldn't those be `.ts`?
