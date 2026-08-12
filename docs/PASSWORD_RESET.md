# Password reset API

All routes below are relative to `/api/auth`.

## 1. Request an OTP

`POST /forgot-password`

```json
{
  "email": "person@example.com"
}
```

The response is intentionally identical whether or not the account exists. If
it does, the API stores a bcrypt hash of a six-digit OTP for 10 minutes and
sends the code through Resend.

## 2. Verify the OTP

`POST /verify-reset-otp`

```json
{
  "email": "person@example.com",
  "otp": "123456"
}
```

A successful response contains a single-use reset token valid for 15 minutes:

```json
{
  "message": "OTP verified successfully",
  "data": {
    "resetToken": "opaque-token",
    "expiresAt": "2026-08-12T12:15:00.000Z"
  }
}
```

## 3. Set the new password

`POST /reset-password`

```json
{
  "resetToken": "opaque-token",
  "newPassword": "a-new-password"
}
```

The reset token is consumed atomically. A successful password update also
revokes existing access/refresh sessions by incrementing the user's session
version and deletes any remaining password-reset credentials.

## Resend configuration

Set `RESEND_API_KEY` and `RESEND_FROM`. The sender must belong to a domain that
has been verified in Resend. `BUSINESS_EMAIL` remains the destination for
contact-us messages.
