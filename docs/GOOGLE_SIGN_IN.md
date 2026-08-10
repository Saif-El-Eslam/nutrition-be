# Google sign-in integration and release guide

This API uses Google Identity Services (GIS) for identity only. The frontend
receives a short-lived Google ID token and sends it to this API. The API verifies
the signature, issuer, expiration, and audience with Google's official auth
library, resolves the user by Google's immutable `sub` claim, and issues the
same HTTP-only access and refresh cookies used by password login.

The app never stores the Google ID token or uses a Google access token as its
session. A Google OAuth client secret is not needed for this flow.

## API contract

### Sign in or create an account

`POST /api/auth/google`

```json
{
  "credential": "GOOGLE_ID_TOKEN_FROM_GIS_CALLBACK"
}
```

The request must use `Content-Type: application/json`. A returning or linked
user receives HTTP 200; a newly created user receives HTTP 201. Both responses
set `accessToken` and `refreshToken` as HTTP-only cookies.

```json
{
  "success": true,
  "data": {
    "id": "...",
    "firstName": "Ada",
    "lastName": "Lovelace",
    "email": "ada@gmail.com",
    "phone": null,
    "role": "customer"
  },
  "meta": {
    "isNewUser": true,
    "needsProfileCompletion": true,
    "passwordLoginAvailable": false
  }
}
```

The frontend must never decode the credential and trust its claims. Only this
API's response establishes an app session.

### Explicitly link an existing account

`POST /api/auth/google/link` has the same body and requires a valid app session
cookie. It is used when an existing app account has a non-Google email address
that was used to create a Google Account. The Google email must exactly match
the signed-in app user's email.

Google is authoritative for Gmail and Google Workspace email addresses, so an
existing user with an exact verified Gmail or Workspace email is linked safely
during `/api/auth/google`. For a third-party mailbox, `/api/auth/google` returns:

```json
{
  "success": false,
  "code": "GOOGLE_ACCOUNT_LINK_REQUIRED",
  "message": "Sign in with your existing password, then link your Google account"
}
```

The frontend should sign the user in normally, obtain a fresh GIS credential,
then call `/api/auth/google/link` with `credentials: "include"`.

### Password and Google login on the same account

Linking Google to a password account does not remove or replace the password;
both login methods continue to resolve to the same user ID.

An account created by Google has no password initially. When
`meta.passwordLoginAvailable` is `false`, the user can continue using Google or
create a password while keeping the current session:

1. `POST /api/auth/forgot-password` with `{ "email": "..." }`.
2. Read the one-time code delivered to that mailbox.
3. `PATCH /api/auth/password` with
   `{ "code": "123456", "newPassword": "..." }` and credentials included.
4. Password login with that email now works and returns the same user ID.

This avoids accepting an unverified password claim or accidentally creating a
second account.

### Change or create a password while signed in

`PATCH /api/auth/password` always requires the HTTP-only app session cookie.

An account that already has a password must re-enter it:

```json
{
  "currentPassword": "existing password",
  "newPassword": "new password of 15 to 72 characters"
}
```

A Google-only account first requests a code through `/api/auth/forgot-password`,
then sends:

```json
{
  "code": "123456",
  "newPassword": "new password of 15 to 72 characters"
}
```

On success, all older access and refresh sessions are invalidated and this
browser receives rotated cookies. The code is single-use. Passwords allow all
characters, must contain at least 6 characters, and must not exceed 72 UTF-8
bytes. The byte limit prevents bcrypt from silently truncating the input.

The logged-out `/api/auth/reset-password` endpoint remains the recovery path. It
also invalidates existing sessions, clears cookies, and requires the user to log
in normally afterward.

## Google Cloud setup

1. Open Google Cloud Console and select or create the application's project.
2. In Google Auth Platform, configure Branding with the real app name, support
   email, home page, privacy policy, and authorized production domain.
3. Configure the Audience. Add developer accounts as test users while the app is
   in testing, then publish it for production when ready.
4. Keep the scopes at the GIS defaults: `openid`, `email`, and `profile`. No
   sensitive Google API scopes are required.
5. Create an OAuth 2.0 Client of type **Web application**.
6. Add exact Authorized JavaScript origins, with no path or trailing slash:
   `http://localhost:3000` and the production frontend origin such as
   `https://example.com`.
7. Callback-mode GIS does not need an authorized redirect URI. Add one only if
   the frontend deliberately switches to redirect mode.
8. Copy the client ID. Put the same public value in the backend
   `GOOGLE_CLIENT_IDS` and the frontend public environment variable. Never put
   a client secret in browser code.

When separate web or native clients use this API, list only this application's
accepted IDs as a comma-separated backend value:

```dotenv
GOOGLE_CLIENT_IDS=web-id.apps.googleusercontent.com,android-id.apps.googleusercontent.com
```

## Backend setup

```bash
nvm use
npm ci
```

Set the development `.env` value:

```dotenv
GOOGLE_CLIENT_IDS=your-web-client-id.apps.googleusercontent.com
FRONTEND_URL=http://localhost:3000
```

The Mongoose user model declares `phone` and `googleSubject` as sparse unique
indexes. This lets multiple Google-created users temporarily omit a phone number
while still enforcing uniqueness for provided phone numbers and Google
identities. No application migration script is used.

Then run:

```bash
npm test
npm run build
npm run dev
```

## What the frontend needs

The frontend needs:

- the public Web OAuth client ID;
- the API base URL, such as `http://localhost:5000/api` or
  `https://api.example.com/api`;
- `credentials: "include"` on Google sign-in and every authenticated or refresh
  request;
- handling for the response `meta` fields and documented conflict codes;
- an authenticated profile-completion screen when `needsProfileCompletion` is
  true (phone can be sent with `PUT /api/profile`);
- a password-creation prompt using the OTP reset flow when
  `passwordLoginAvailable` is false and the product wants both login methods.

## Next.js App Router example

This example uses TypeScript and the App Router. It does not require a Google
React package; GIS renders its official button directly.

### 1. Frontend environment

Create `.env.local` for development:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
```

Use the equivalent HTTPS API URL and production Web client ID when building for
production. `NEXT_PUBLIC_*` values are embedded in the client bundle at build
time, so changing them requires a new frontend build. The client ID is public;
never add the Google client secret to the frontend.

### 2. GIS browser types

Create `src/types/google-identity.d.ts`:

```ts
export {};

type GoogleCredentialResponse = {
  credential: string;
  select_by: string;
};

type GoogleIdConfiguration = {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
};

type GoogleButtonConfiguration = {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "small" | "medium" | "large";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  width?: number;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(config: GoogleIdConfiguration): void;
          renderButton(
            parent: HTMLElement,
            options: GoogleButtonConfiguration,
          ): void;
          disableAutoSelect(): void;
        };
      };
    };
  }
}
```

Make sure the frontend `tsconfig.json` includes `src/**/*.d.ts`; the default
Create Next App configuration normally does.

### 3. Cookie-enabled API helper

Create `src/lib/api.ts`:

```ts
const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!configuredApiUrl) {
  throw new Error("NEXT_PUBLIC_API_URL is not configured");
}

export const API_URL = configuredApiUrl.replace(/\/$/, "");

type ApiErrorBody = {
  message?: string;
  code?: string;
  [key: string]: unknown;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  details: unknown;

  constructor(status: number, body: ApiErrorBody | null) {
    super(body?.message || `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.code = body?.code;
    this.details = body;
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    const errorBody =
      body && typeof body === "object" ? (body as ApiErrorBody) : null;
    throw new ApiError(response.status, errorBody);
  }
  return body as T;
}
```

Every authenticated, refresh, login, and logout request must use
`credentials: "include"`; otherwise the browser will neither accept nor send
the API's auth cookies.

### 4. Reusable Google button

Create `src/components/auth/GoogleAuthButton.tsx`:

```tsx
"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

import { apiFetch } from "@/lib/api";

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role: "customer" | "specialist" | "admin";
};

export type AuthResponse = {
  success: true;
  data: User;
  meta?: {
    isNewUser: boolean;
    needsProfileCompletion: boolean;
    passwordLoginAvailable: boolean;
  };
};

type Props = {
  mode?: "signin" | "link";
  onSuccess(result: AuthResponse): void;
  onError(error: Error): void;
};

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function GoogleAuthButton({
  mode = "signin",
  onSuccess,
  onError,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const modeRef = useRef(mode);
  const successRef = useRef(onSuccess);
  const errorRef = useRef(onError);
  const [scriptError, setScriptError] = useState(false);

  useEffect(() => {
    modeRef.current = mode;
    successRef.current = onSuccess;
    errorRef.current = onError;
  }, [mode, onSuccess, onError]);

  const initializeGoogle = useCallback(() => {
    if (initializedRef.current || !window.google || !containerRef.current) {
      return;
    }
    if (!clientId) {
      errorRef.current(
        new Error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured"),
      );
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      auto_select: false,
      callback: async ({ credential }) => {
        try {
          const endpoint =
            modeRef.current === "link" ? "/auth/google/link" : "/auth/google";
          const result = await apiFetch<AuthResponse>(endpoint, {
            method: "POST",
            body: JSON.stringify({ credential }),
          });
          successRef.current(result);
        } catch (error) {
          errorRef.current(
            error instanceof Error ? error : new Error("Google sign-in failed"),
          );
        }
      },
    });

    containerRef.current.replaceChildren();
    window.google.accounts.id.renderButton(containerRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      shape: "rectangular",
      text: modeRef.current === "link" ? "continue_with" : "signin_with",
      width: 320,
    });
    initializedRef.current = true;
  }, []);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={initializeGoogle}
        onError={() => setScriptError(true)}
      />
      <div ref={containerRef} aria-label="Sign in with Google" />
      {scriptError && <p>Google sign-in could not be loaded.</p>}
    </>
  );
}
```

Do not decode or persist `credential` in the browser. Send it immediately to
the backend and treat only the backend response as an authenticated session.

### 5. Login page

Create `src/app/login/page.tsx`:

```tsx
"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import {
  type AuthResponse,
  GoogleAuthButton,
} from "@/components/auth/GoogleAuthButton";
import { ApiError, apiFetch } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [googleResult, setGoogleResult] = useState<AuthResponse | null>(null);

  const continueToApp = (result: AuthResponse) => {
    if (result.meta?.needsProfileCompletion) {
      router.replace("/onboarding");
    } else {
      router.replace("/dashboard");
    }
    router.refresh();
  };

  const finishLogin = (result: AuthResponse) => {
    if (result.meta?.passwordLoginAvailable === false) {
      // The Google session is already active. Pause only to let the user choose
      // whether to add password login before continuing.
      setGoogleResult(result);
      return;
    }
    continueToApp(result);
  };

  const handlePasswordLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    try {
      const result = await apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      finishLogin(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setPending(false);
    }
  };

  const handleGoogleError = (error: Error) => {
    if (
      error instanceof ApiError &&
      error.code === "GOOGLE_ACCOUNT_LINK_REQUIRED"
    ) {
      setError(
        "Sign in with your existing password, then link Google from settings.",
      );
      return;
    }
    setError(error.message);
  };

  return (
    <main>
      <h1>Sign in</h1>

      <GoogleAuthButton onSuccess={finishLogin} onError={handleGoogleError} />

      <p>or use your password</p>

      <form onSubmit={handlePasswordLogin}>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        <button disabled={pending} type="submit">
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {error && <p role="alert">{error}</p>}

      {googleResult && (
        <section>
          <p>
            You are signed in. Would you also like to enable password login?
          </p>
          <a href="/settings/password?setup=1">Create a password</a>
          <button type="button" onClick={() => continueToApp(googleResult)}>
            Continue without a password
          </button>
        </section>
      )}
    </main>
  );
}
```

Because this user is already signed in through Google, the password-creation
page should call `/auth/forgot-password`, collect the OTP, then call the
authenticated `/auth/password` endpoint with `code` and `newPassword`.

### 6. Explicit linking page

Only show this page to an authenticated user. Create
`src/app/settings/link-google/page.tsx`:

```tsx
"use client";

import { useState } from "react";

import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

export default function LinkGooglePage() {
  const [message, setMessage] = useState<string | null>(null);

  return (
    <main>
      <h1>Link Google account</h1>
      <p>Choose the Google account with the same email as this account.</p>

      <GoogleAuthButton
        mode="link"
        onSuccess={() => setMessage("Google account linked successfully.")}
        onError={(error) => setMessage(error.message)}
      />

      {message && <p role="status">{message}</p>}
    </main>
  );
}
```

This page is only needed after `/auth/google` returns
`GOOGLE_ACCOUNT_LINK_REQUIRED`. Gmail and Google Workspace matches link
automatically.

### 7. Profile, refresh, and logout calls

```ts
import type { User } from "@/components/auth/GoogleAuthButton";
import { apiFetch } from "@/lib/api";

// Verify the current cookie session.
const profile = await apiFetch<User>("/profile");

// Rotate access and refresh cookies.
await apiFetch("/auth/refresh-token", { method: "POST" });

// Clear the API cookies, then clear Google's automatic account selection.
await apiFetch("/auth/logout", { method: "POST" });
window.google?.accounts.id.disableAutoSelect();
```

Change an existing password:

```ts
await apiFetch("/auth/password", {
  method: "PATCH",
  body: JSON.stringify({
    currentPassword,
    newPassword,
  }),
});
```

Create the first password for a signed-in Google-only account:

```ts
await apiFetch("/auth/forgot-password", {
  method: "POST",
  body: JSON.stringify({ email: currentUser.email }),
});

// After collecting the emailed code:
await apiFetch("/auth/password", {
  method: "PATCH",
  body: JSON.stringify({ code, newPassword }),
});
```

Do not call Google's `revoke()` during ordinary app logout. Revocation disconnects
the user's Google consent; normal logout only needs to clear the application
session and disable automatic account selection.

### 8. Frontend headers

Merge these sources into the frontend's existing Content Security Policy:

```text
script-src https://accounts.google.com/gsi/client
frame-src https://accounts.google.com/gsi/
connect-src https://accounts.google.com/gsi/
style-src https://accounts.google.com/gsi/style
```

If popup behavior is affected when FedCM is unavailable, set
`Cross-Origin-Opener-Policy: same-origin-allow-popups`. Do not replace stricter
existing directives blindly; merge only the Google sources into the policy.

Load GIS directly from Google; do not self-host the script. A framework-neutral
callback looks like this:

```js
async function handleGoogleCredential({ credential }) {
  const response = await fetch(`${API_URL}/auth/google`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });

  const result = await response.json();
  if (!response.ok) throw result;

  // Store only non-sensitive user state. Tokens remain in HTTP-only cookies.
  return result;
}
```

Use the button rendered by GIS rather than a custom imitation. The frontend's
Content Security Policy normally needs these sources:

```text
script-src https://accounts.google.com/gsi/client
frame-src https://accounts.google.com/gsi/
connect-src https://accounts.google.com/gsi/
style-src https://accounts.google.com/gsi/style
```

If popup behavior is affected by Cross-Origin-Opener-Policy when FedCM is not
active, use `same-origin-allow-popups` as directed by the GIS setup guide.

## Step-by-step local verification

1. Add `http://localhost:3000` to the Google client's Authorized JavaScript
   origins and add the test Google account to the OAuth audience.
2. Configure both apps with the same client ID, start the API and frontend, and
   open browser DevTools on the Network and Application tabs.
3. Click the GIS-rendered button. Confirm `POST /api/auth/google` returns 201 for
   a new Google account, the response contains no token, and the response headers
   set HTTP-only `accessToken` and `refreshToken` cookies.
4. Confirm `GET /api/profile` with credentials returns the same `data.id`.
5. Log out with `POST /api/auth/logout`, confirm the cookies are cleared, and
   confirm `GET /api/profile` now returns 401.
6. Sign in with Google again. Confirm HTTP 200 and the same user ID; inspect the
   database to verify that no duplicate user was created.
7. Wait for or simulate an expired access cookie, call
   `POST /api/auth/refresh-token` with credentials, and verify profile access is
   restored with rotated cookies.
8. Send `POST /api/auth/google` with a fake credential. Confirm HTTP 401 and
   `INVALID_GOOGLE_TOKEN`. Also test a valid token issued to a different OAuth
   client ID and confirm it is rejected.
9. Test local-first interoperability: create a password user with a Gmail
   address, use Google with the same address, verify the same user ID, log out,
   then verify the original password still signs in to that same ID.
10. Test Google-first interoperability: create a new Google user, confirm
    `passwordLoginAvailable: false`, request the OTP, call authenticated
    `PATCH /api/auth/password`, log out, then verify password login returns the
    same user ID.
11. Test safe explicit linking with a Google Account backed by a third-party
    mailbox: create the password account first, expect
    `GOOGLE_ACCOUNT_LINK_REQUIRED`, password-login, call `/api/auth/google/link`,
    and verify both methods now return the same ID.
12. For an existing password user, change the password with `currentPassword`.
    Confirm the old password and previously issued cookies fail, while the new
    password and rotated cookies work.
13. Complete the phone field through `PUT /api/profile`; confirm another user
    cannot reuse the same phone.

Automated tests cover route protection, audience passing, required verified
claims, Google-authoritative email decisions, and the password/phone schema
rules. A real-browser test is still required because Google does not issue a
real GIS credential in an offline unit test.

## Production readiness checklist

1. Confirm the production MongoDB user collection reflects the sparse unique
   indexes declared by the Mongoose model for `phone` and `googleSubject`.
2. Set production `GOOGLE_CLIENT_IDS` to the production client's exact ID and
   restart PM2 with updated environment variables.
3. Configure the exact HTTPS frontend origin in Google Cloud and as
   `FRONTEND_URL`; remove unused development/test origins from the production
   OAuth client.
4. Publish the Google Auth audience and complete Branding, authorized domains,
   privacy policy, terms, support contact, and any verification Google requests.
5. Serve both apps only through HTTPS. Prefer frontend and API hosts under the
   same registrable domain (for example `example.com` and `api.example.com`) or
   reverse-proxy `/api` from the frontend host to avoid third-party-cookie
   restrictions.
6. Confirm CORS allows only the exact production frontend and supports
   credentials. Do not use `*` with credentialed requests.
7. Confirm production cookies are `HttpOnly`, `Secure`, and `SameSite=None` for
   the current cross-origin deployment. If the API becomes same-origin, reassess
   whether `Lax` is sufficient.
8. Apply the frontend GIS CSP/COOP requirements and keep the Google button
   library loaded from Google's URL.
9. Exercise every case in the local verification list against staging, including
   duplicate prevention, refresh rotation, logout, wrong-audience rejection,
   both account-linking directions, and phone completion.
10. Monitor 401, 409, 429, and 5xx rates on `/api/auth/google` without logging
    credentials, Google ID tokens, app JWTs, or cookies. Alert on unusual spikes.
11. Keep `google-auth-library` and Node.js patched, run `npm audit`, review the
    findings rather than applying breaking force-upgrades blindly, and rerun the
    auth tests after upgrades.

Official references:

- <https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid>
- <https://developers.google.com/identity/sign-in/web/backend-auth>
- <https://developers.google.com/identity/openid-connect/openid-connect>
- <https://developers.google.com/identity/gsi/web/reference/js-reference>
- <https://nextjs.org/docs/app/guides/scripts>
- <https://nextjs.org/docs/pages/guides/environment-variables>
