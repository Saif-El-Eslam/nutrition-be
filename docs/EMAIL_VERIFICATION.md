# Optional email verification API

Email verification is not required before signup. Password signups create an
account with `emailVerified: false`; that field is included in serialized user
responses such as signup and login. Google accounts are created or linked with
`emailVerified: true` because the Google credential contains a verified email
claim.

All routes below are relative to `/api/auth`.

## Create an unverified account

`POST /signup`

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "phone": "+201001234567",
  "password": "StrongPassword123!"
}
```

No OTP is required. The returned user includes:

```json
{
  "email": "jane@example.com",
  "emailVerified": false
}
```

## Send the verification OTP

`POST /send-otp`

```json
{
  "email": "jane@example.com"
}
```

If the registered account is still unverified, a six-digit OTP is sent and is
valid for 10 minutes. The response remains neutral for unknown or already
verified email addresses.

## Verify the registered email

`POST /verify-otp`

```json
{
  "email": "jane@example.com",
  "code": "123456"
}
```

A successful response includes:

```json
{
  "message": "OTP verified successfully",
  "data": {
    "email": "jane@example.com",
    "emailVerified": true
  }
}
```
