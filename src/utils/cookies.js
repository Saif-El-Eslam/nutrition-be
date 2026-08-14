import env from "#config/env.js";

const isLife =
  env.environment === "production" || env.environment === "development";

// Base cookie options shared across all auth cookies.
//  httpOnly   — JS cannot read or modify the cookie (mitigates XSS token theft)
//  secure     — only sent over HTTPS in production
//  sameSite   — "none" in production (needed for cross-origin API/frontend
//                deployments); "lax" in development so non-HTTPS localhost works
const BASE_OPTIONS = {
  httpOnly: true,
  secure: isLife,
  sameSite: isLife ? "none" : "lax",
};

//  The refresh token cookie is scoped to /api/auth so it is NOT sent on every
//  request — only when the browser hits an auth route, reducing exposure.
const REFRESH_COOKIE_PATH = "/api/auth";

//  Set both auth cookies on the response.
export const setCookies = (res, { accessToken, refreshToken }) => {
  res.cookie("accessToken", accessToken, {
    ...BASE_OPTIONS,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });

  res.cookie("refreshToken", refreshToken, {
    ...BASE_OPTIONS,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: REFRESH_COOKIE_PATH,
  });
};

//  Clear both auth cookies (call on logout or token revocation).
//  Must use the same options that were passed to res.cookie() to ensure
//  the browser actually removes the cookie.
export const clearCookies = (res) => {
  res.clearCookie("accessToken", { ...BASE_OPTIONS });
  res.clearCookie("refreshToken", {
    ...BASE_OPTIONS,
    path: REFRESH_COOKIE_PATH,
  });
};
