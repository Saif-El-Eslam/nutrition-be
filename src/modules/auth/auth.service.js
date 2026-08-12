import User from "#models/user.js";
import Otp from "#models/otp.js";
import PasswordResetToken from "#models/passwordResetToken.js";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";

import generateOTP from "#utils/otp.js";
import jwt from "#utils/jwt.js";
import sendEmail from "#utils/email.js";
import { otpEmailTemplate } from "#utils/emailTemplates.js";
import { ERROR_CODES, translate } from "#utils/localization.js";
import { serializeUser } from "#serializers/user.serializer.js";
import {
  isGoogleAuthoritativeForEmail,
  verifyGoogleIdToken,
} from "#utils/googleIdentity.js";

const OTP_TTL_MS = 10 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;

const hashResetToken = (token) =>
  createHash("sha256").update(token).digest("hex");

const findValidOtp = (email, purpose) =>
  Otp.findOne({
    email,
    purpose,
    verified: false,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  }).select("+codeHash");

const otpMatches = (otp, code) =>
  Boolean(otp?.codeHash) && bcrypt.compare(code, otp.codeHash);

const appError = (code, status) => {
  const error = new Error(translate(code, "en"));
  error.code = code;
  error.status = status;
  return error;
};

const createSession = async (user) => {
  const tokenUser = {
    id: user._id,
    role: user.role,
    sessionVersion: user.sessionVersion ?? 0,
  };
  const refreshToken = jwt.signRefreshToken(tokenUser);
  user.refreshToken = refreshToken;
  await user.save();

  const accessToken = jwt.signAccessToken(tokenUser);

  if (user.role === "specialist") {
    user.assignedCustomersCount = await User.countDocuments({
      specialist: user._id,
    });
  }

  const serializedUser = await serializeUser(
    await user.populate("specialist", "id firstName lastName email"),
  );
  if (user.assignedCustomersCount !== undefined) {
    serializedUser.assignedCustomersCount = user.assignedCustomersCount;
  }

  return {
    accessToken,
    refreshToken,
    user: serializedUser,
  };
};

const getGoogleNames = ({ firstName, lastName, name, email }) => {
  const nameParts = name?.split(/\s+/).filter(Boolean) ?? [];
  return {
    firstName:
      firstName || nameParts[0] || email.split("@")[0] || "Google User",
    lastName: lastName || nameParts.slice(1).join(" ") || "User",
  };
};

const sendOtp = async ({ email }) => {
  // Delete any existing OTP for this user
  await Otp.deleteMany({ email, purpose: "verify_account" });

  const otp = generateOTP();

  const otpRecord = await Otp.create({
    email,
    codeHash: await bcrypt.hash(otp, 12),
    purpose: "verify_account",
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });

  try {
    await sendEmail({
      to: email,
      subject: "Verify Your Email - OTP Code",
      html: otpEmailTemplate(otp),
    });
  } catch (error) {
    await Otp.deleteOne({ _id: otpRecord._id });
    throw error;
  }

  return email;
};

const verifyOtp = async ({ email, code }) => {
  const otp = await findValidOtp(email, "verify_account");

  if (!(await otpMatches(otp, code))) {
    const error = new Error(translate(ERROR_CODES.OTP_INVALID, "en"));
    error.code = ERROR_CODES.OTP_INVALID;
    error.status = 400;
    throw error;
  }

  const verifiedOtp = await Otp.findOneAndUpdate(
    {
      _id: otp._id,
      verified: false,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    },
    {
      $set: {
        verified: true,
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    },
  );
  if (!verifiedOtp) {
    throw appError(ERROR_CODES.OTP_INVALID, 400);
  }

  return true;
};

const signup = async ({ firstName, lastName, email, password, phone }) => {
  const exists = await User.findOne({ email });
  if (exists) {
    const error = new Error(translate(ERROR_CODES.EMAIL_ALREADY_EXISTS, "en"));
    error.code = ERROR_CODES.EMAIL_ALREADY_EXISTS;
    error.status = 409;
    throw error;
  }

  const existsPhone = await User.findOne({ phone });
  if (existsPhone) {
    const error = new Error(translate(ERROR_CODES.PHONE_ALREADY_EXISTS, "en"));
    error.code = ERROR_CODES.PHONE_ALREADY_EXISTS;
    error.status = 409;
    throw error;
  }

  const otp = await Otp.findOne({
    email,
    purpose: "verify_account",
    verified: true,
    expiresAt: { $gt: new Date() },
  });
  if (!otp) {
    const error = new Error(translate(ERROR_CODES.EMAIL_NOT_VERIFIED, "en"));
    error.code = ERROR_CODES.EMAIL_NOT_VERIFIED;
    error.status = 400;
    throw error;
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    phone,
    passwordHash: password,
  });

  await Otp.deleteMany({ email, purpose: "verify_account" });

  return serializeUser(user);
};

const login = async ({ email, phone, password }) => {
  const identifier = email || phone;
  const user = await User.findOne({
    $or: [{ email: identifier }, { phone: identifier }],
  }).select("+passwordHash +sessionVersion");
  if (!user) {
    const error = new Error(translate(ERROR_CODES.INVALID_CREDENTIALS, "en"));
    error.code = ERROR_CODES.INVALID_CREDENTIALS;
    error.status = 401;
    throw error;
  }

  const match = await user.comparePassword(password);
  if (!match) {
    const error = new Error(translate(ERROR_CODES.INVALID_CREDENTIALS, "en"));
    error.code = ERROR_CODES.INVALID_CREDENTIALS;
    error.status = 401;
    throw error;
  }

  return createSession(user);
};

const googleSignIn = async ({ credential }) => {
  const googleProfile = await verifyGoogleIdToken(credential);

  // Always resolve returning users by Google's immutable subject first.
  let user = await User.findOne({
    googleSubject: googleProfile.subject,
  }).select("+googleSubject +passwordHash +sessionVersion");
  let isNewUser = false;

  if (!user) {
    user = await User.findOne({ email: googleProfile.email }).select(
      "+googleSubject +passwordHash +sessionVersion",
    );

    if (user) {
      if (user.googleSubject && user.googleSubject !== googleProfile.subject) {
        throw appError(ERROR_CODES.GOOGLE_ACCOUNT_CONFLICT, 409);
      }

      if (!isGoogleAuthoritativeForEmail(googleProfile)) {
        throw appError(ERROR_CODES.GOOGLE_ACCOUNT_LINK_REQUIRED, 409);
      }

      // Gmail and Workspace identities can be safely linked by verified email.
      user.googleSubject = googleProfile.subject;
      if (!user.avatarUrl && googleProfile.picture) {
        user.avatarUrl = googleProfile.picture;
      }
      try {
        await user.save();
      } catch (error) {
        if (error.code === 11000) {
          throw appError(ERROR_CODES.GOOGLE_ACCOUNT_CONFLICT, 409);
        }
        throw error;
      }
    } else {
      const names = getGoogleNames(googleProfile);
      try {
        user = await User.create({
          ...names,
          email: googleProfile.email,
          googleSubject: googleProfile.subject,
          avatarUrl: googleProfile.picture,
        });
        isNewUser = true;
      } catch (error) {
        // Make concurrent first sign-ins idempotent. A parallel request may
        // have created the same Google user after our initial lookup.
        if (error.code !== 11000) throw error;
        user = await User.findOne({
          googleSubject: googleProfile.subject,
        }).select("+googleSubject +passwordHash +sessionVersion");
        if (!user) {
          throw appError(ERROR_CODES.GOOGLE_ACCOUNT_CONFLICT, 409);
        }
      }
    }
  }

  return {
    ...(await createSession(user)),
    isNewUser,
    passwordLoginAvailable: Boolean(user.passwordHash),
  };
};

const linkGoogleAccount = async (userId, { credential }) => {
  const googleProfile = await verifyGoogleIdToken(credential);
  const user = await User.findById(userId).select("+googleSubject");

  if (!user) {
    throw appError(ERROR_CODES.USER_NOT_FOUND, 404);
  }

  if (user.email.toLowerCase() !== googleProfile.email) {
    throw appError(ERROR_CODES.GOOGLE_EMAIL_MISMATCH, 409);
  }

  const linkedUser = await User.findOne({
    googleSubject: googleProfile.subject,
  });
  if (linkedUser && String(linkedUser._id) !== String(user._id)) {
    throw appError(ERROR_CODES.GOOGLE_ACCOUNT_CONFLICT, 409);
  }
  if (user.googleSubject && user.googleSubject !== googleProfile.subject) {
    throw appError(ERROR_CODES.GOOGLE_ACCOUNT_CONFLICT, 409);
  }

  user.googleSubject = googleProfile.subject;
  if (!user.avatarUrl && googleProfile.picture) {
    user.avatarUrl = googleProfile.picture;
  }

  try {
    await user.save();
  } catch (error) {
    if (error.code === 11000) {
      throw appError(ERROR_CODES.GOOGLE_ACCOUNT_CONFLICT, 409);
    }
    throw error;
  }

  return serializeUser(user);
};

const refreshToken = async (token) => {
  const payload = jwt.verifyRefreshToken(token);

  const user = await User.findById(payload.user_id).select(
    "+refreshToken +sessionVersion",
  );
  const tokenSessionVersion = payload.session_version ?? 0;
  const currentSessionVersion = user?.sessionVersion ?? 0;

  if (
    !user ||
    user.refreshToken !== token ||
    currentSessionVersion !== tokenSessionVersion
  ) {
    const error = new Error(translate(ERROR_CODES.INVALID_REFRESH_TOKEN, "en"));
    error.code = ERROR_CODES.INVALID_REFRESH_TOKEN;
    error.status = 401;
    throw error;
  }

  // Rotate: issue a new refresh token so the old one is invalidated.
  // This limits the damage window if a refresh token is stolen.
  const newAccessToken = jwt.signAccessToken({
    id: user._id,
    role: user.role,
    sessionVersion: currentSessionVersion,
  });
  const newRefreshToken = jwt.signRefreshToken({
    id: user._id,
    role: user.role,
    sessionVersion: currentSessionVersion,
  });

  user.refreshToken = newRefreshToken;
  await user.save();

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user: await serializeUser(user),
  };
};

const forgotPassword = async ({ email }) => {
  const user = await User.findOne({ email });
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  // Always return the same response shape, even when the address is unknown.
  // This prevents the endpoint from being used to enumerate accounts.
  if (!user) {
    return { expiresAt };
  }

  const otp = generateOTP();

  // Only credentials from the newest password-reset request remain valid.
  await Otp.deleteMany({ email, purpose: "reset_password" });
  await PasswordResetToken.deleteMany({ user: user._id });

  const otpRecord = await Otp.create({
    email,
    codeHash: await bcrypt.hash(otp, 12),
    purpose: "reset_password",
    expiresAt,
  });

  try {
    await sendEmail({
      to: email,
      subject: "Reset Your Password - OTP Code",
      html: otpEmailTemplate(otp, "reset_password"),
    });
  } catch (error) {
    await Otp.deleteOne({ _id: otpRecord._id });
    throw error;
  }

  return { expiresAt };
};

const verifyResetOtp = async ({ email, otp: submittedOtp }) => {
  const otp = await findValidOtp(email, "reset_password");
  if (!(await otpMatches(otp, submittedOtp))) {
    throw appError(ERROR_CODES.OTP_INVALID, 400);
  }

  // Atomically consume the OTP so concurrent verification requests cannot
  // mint more than one reset credential.
  const consumedOtp = await Otp.findOneAndUpdate(
    {
      _id: otp._id,
      verified: false,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    },
    { $set: { verified: true, usedAt: new Date() } },
  );
  if (!consumedOtp) {
    throw appError(ERROR_CODES.OTP_INVALID, 400);
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw appError(ERROR_CODES.OTP_INVALID, 400);
  }

  const resetToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await PasswordResetToken.deleteMany({ user: user._id });
  await PasswordResetToken.create({
    user: user._id,
    tokenHash: hashResetToken(resetToken),
    expiresAt,
  });

  return { resetToken, expiresAt };
};

const resetPassword = async ({ resetToken, newPassword }) => {
  const token = await PasswordResetToken.findOne({
    tokenHash: hashResetToken(resetToken),
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });
  if (!token) {
    throw appError(ERROR_CODES.RESET_TOKEN_INVALID, 401);
  }

  const user = await User.findById(token.user).select(
    "+passwordHash +refreshToken +sessionVersion",
  );
  if (!user) {
    throw appError(ERROR_CODES.RESET_TOKEN_INVALID, 401);
  }

  if (await user.comparePassword(newPassword)) {
    throw appError(ERROR_CODES.NEW_PASSWORD_MUST_DIFFER, 400);
  }

  // Claim the token only after request-level checks pass. The conditional
  // update makes the claim atomic, so concurrent reset attempts cannot both
  // proceed.
  const consumedToken = await PasswordResetToken.findOneAndUpdate(
    {
      _id: token._id,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    },
    { $set: { usedAt: new Date() } },
  );
  if (!consumedToken) {
    throw appError(ERROR_CODES.RESET_TOKEN_INVALID, 401);
  }

  user.passwordHash = newPassword;
  user.refreshToken = null;
  user.sessionVersion = (user.sessionVersion ?? 0) + 1;
  await user.save();

  await Promise.all([
    PasswordResetToken.deleteMany({ user: user._id }),
    Otp.deleteMany({ email: user.email, purpose: "reset_password" }),
  ]);

  return true;
};

const changePassword = async (
  userId,
  { currentPassword, code, newPassword },
) => {
  const user = await User.findById(userId).select(
    "+passwordHash +refreshToken +sessionVersion",
  );
  if (!user) {
    throw appError(ERROR_CODES.USER_NOT_FOUND, 404);
  }

  if (user.passwordHash) {
    if (!currentPassword || !(await user.comparePassword(currentPassword))) {
      throw appError(ERROR_CODES.INVALID_CURRENT_PASSWORD, 401);
    }
  } else {
    if (!code) {
      throw appError(ERROR_CODES.PASSWORD_SETUP_CODE_REQUIRED, 400);
    }

    // Google-only accounts prove mailbox control before adding a reusable
    // password. Preserve this authenticated flow while OTPs are stored hashed.
    const otp = await findValidOtp(user.email, "reset_password");
    if (!(await otpMatches(otp, code))) {
      throw appError(ERROR_CODES.OTP_INVALID, 400);
    }

    const consumedOtp = await Otp.findOneAndDelete({
      _id: otp._id,
      verified: false,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    });
    if (!consumedOtp) throw appError(ERROR_CODES.OTP_INVALID, 400);
  }

  if (await user.comparePassword(newPassword)) {
    throw appError(ERROR_CODES.NEW_PASSWORD_MUST_DIFFER, 400);
  }

  user.passwordHash = newPassword;
  user.refreshToken = null;
  user.sessionVersion = (user.sessionVersion ?? 0) + 1;
  await user.save();

  await Promise.all([
    Otp.deleteMany({
      email: user.email,
      purpose: "reset_password",
    }),
    PasswordResetToken.deleteMany({ user: user._id }),
  ]);

  // Keep this browser signed in with fresh cookies while all tokens issued for
  // the prior session version are rejected.
  return createSession(user);
};

const logout = async (userId) => {
  const user = await User.findById(userId).select(
    "+refreshToken +sessionVersion",
  );
  if (user) {
    user.refreshToken = null;
    user.sessionVersion = (user.sessionVersion ?? 0) + 1;
    await user.save();
  }
};

export default {
  signup,
  login,
  googleSignIn,
  linkGoogleAccount,
  sendOtp,
  verifyOtp,
  refreshToken,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  changePassword,
  logout,
};
