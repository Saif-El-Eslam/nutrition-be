import { OAuth2Client } from "google-auth-library";

import env from "#config/env.js";
import { ERROR_CODES, translate } from "#utils/localization.js";

const oauthClient = new OAuth2Client();

const appError = (code, status) => {
  const error = new Error(translate(code, "en"));
  error.code = code;
  error.status = status;
  return error;
};

/**
 * Verify a Google Identity Services ID token using Google's public keys.
 * The library validates the signature, issuer, expiry, and audience.
 */
export const verifyGoogleIdToken = async (
  credential,
  { client = oauthClient, audiences = env.googleClientIds } = {},
) => {
  if (!audiences.length) {
    throw appError(ERROR_CODES.GOOGLE_AUTH_NOT_CONFIGURED, 503);
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: audiences,
    });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      throw new Error("Google token is missing required verified identity claims");
    }

    return {
      subject: payload.sub,
      email: payload.email.trim().toLowerCase(),
      emailVerified: true,
      firstName: payload.given_name?.trim() || null,
      lastName: payload.family_name?.trim() || null,
      name: payload.name?.trim() || null,
      picture: payload.picture?.startsWith("https://")
        ? payload.picture
        : null,
      hostedDomain: payload.hd?.trim().toLowerCase() || null,
    };
  } catch (error) {
    if (error.code === ERROR_CODES.GOOGLE_AUTH_NOT_CONFIGURED) throw error;
    throw appError(ERROR_CODES.INVALID_GOOGLE_TOKEN, 401);
  }
};

/**
 * Google remains authoritative for Gmail and Workspace addresses. For Google
 * accounts backed by another email provider, an existing app account must be
 * challenged before linking because ownership of that mailbox may have changed.
 */
export const isGoogleAuthoritativeForEmail = ({ email, hostedDomain }) =>
  email.endsWith("@gmail.com") || Boolean(hostedDomain);

export default verifyGoogleIdToken;
