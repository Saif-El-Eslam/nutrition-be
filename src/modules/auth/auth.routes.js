import express from "express";
import controller from "./auth.controller.js";
import validators from "./auth.validators.js";
import handleValidationErrors from "#middlewares/validation.js";
import authenticate from "#middlewares/auth.js";
import {
  strictLoginLimiter,
  moderateLimiter,
  emailRateLimiter,
} from "#middlewares/rateLimiter.js";

const router = express.Router();

// TIER 1: Very Strict - OTP sending (2 per hour per email)
router.post(
  "/send-otp",
  emailRateLimiter,
  validators.sendOtp,
  handleValidationErrors,
  controller.sendOtp,
);

// TIER 1: Very Strict - OTP verification (3 per 15 mins per user)
router.post(
  "/verify-otp",
  strictLoginLimiter,
  validators.verifyOtp,
  handleValidationErrors,
  controller.verifyOtp,
);

// TIER 2: Moderate - Signup (5 per 15 mins)
router.post(
  "/signup",
  moderateLimiter,
  validators.signup,
  handleValidationErrors,
  controller.signup,
);

// TIER 1: Very Strict - Login (3 per 15 mins per user)
router.post(
  "/login",
  strictLoginLimiter,
  validators.login,
  handleValidationErrors,
  controller.login,
);

// Google Identity Services returns an ID token to the frontend. The backend
// verifies it, then creates the same cookie session used by password login.
router.post(
  "/google",
  strictLoginLimiter,
  validators.googleCredential,
  handleValidationErrors,
  controller.googleSignIn,
);

// Explicit linking is used when Google is not authoritative for the email
// address (for example, a Google Account backed by a non-Google mailbox).
router.post(
  "/google/link",
  authenticate,
  moderateLimiter,
  validators.googleCredential,
  handleValidationErrors,
  controller.linkGoogleAccount,
);

// TIER 2: Moderate - Refresh token (5 per 15 mins)
router.post(
  "/refresh-token",
  moderateLimiter,
  validators.refreshToken,
  handleValidationErrors,
  controller.refreshToken,
);

// TIER 2: Moderate - Forgot password request (5 per 15 mins)
router.post(
  "/forgot-password",
  moderateLimiter,
  validators.forgotPassword,
  handleValidationErrors,
  controller.forgotPassword,
);

// TIER 2: Moderate - Reset password (5 per 15 mins)
router.post(
  "/reset-password",
  moderateLimiter,
  validators.resetPassword,
  handleValidationErrors,
  controller.resetPassword,
);

// Authenticated password change. Password accounts re-enter their current
// password; Google-only accounts verify the email OTP before adding one.
router.patch(
  "/password",
  authenticate,
  strictLoginLimiter,
  validators.changePassword,
  handleValidationErrors,
  controller.changePassword,
);

// TIER 2: Moderate - Logout (5 per 15 mins)
router.post(
  "/logout",
  moderateLimiter,
  authenticate,
  validators.logout,
  handleValidationErrors,
  controller.logout,
);

export default router;
