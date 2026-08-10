import User from "#models/user.js";
import Otp from "#models/otp.js";

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

  await Otp.create({
    email,
    code: otp,
    purpose: "verify_account",
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  // send email
  await sendEmail({
    to: email,
    subject: "Verify Your Email - OTP Code",
    html: otpEmailTemplate(otp),
  });

  return email;
};

const verifyOtp = async ({ email, code }) => {
  const otp = await Otp.findOne({
    email,
    code,
    purpose: "verify_account",
    expiresAt: { $gt: new Date() },
  });

  if (!otp) {
    const error = new Error(translate(ERROR_CODES.OTP_INVALID, "en"));
    error.code = ERROR_CODES.OTP_INVALID;
    error.status = 400;
    throw error;
  }

  // Mark OTP as verified
  otp.verified = true;
  otp.expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000);
  await otp.save();

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

  // const otp = await Otp.findOne({
  //   email,
  //   purpose: "verify_account",
  //   verified: true,
  // });
  // if (!otp) {
  //   const error = new Error(translate(ERROR_CODES.EMAIL_NOT_VERIFIED, "en"));
  //   error.code = ERROR_CODES.EMAIL_NOT_VERIFIED;
  //   error.status = 400;
  //   throw error;
  // }

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
  if (!user) {
    const error = new Error(translate(ERROR_CODES.EMAIL_NOT_FOUND, "en"));
    error.code = ERROR_CODES.EMAIL_NOT_FOUND;
    error.status = 404;
    throw error;
  }

  const otp = generateOTP();

  // Only the newest password-reset code remains valid.
  await Otp.deleteMany({ email, purpose: "reset_password" });

  const _otp = await Otp.create({
    email,
    code: otp,
    purpose: "reset_password",
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  // send email
  await sendEmail({
    to: email,
    subject: "Reset Your Password - OTP Code",
    html: otpEmailTemplate(otp, "reset_password"),
  });

  return { email, expiresAt: _otp.expiresAt };
};

const resetPassword = async ({ email, code, password }) => {
  const user = await User.findOne({ email }).select(
    "+passwordHash +refreshToken +sessionVersion",
  );
  if (!user) {
    const error = new Error(translate(ERROR_CODES.USER_NOT_FOUND, "en"));
    error.code = ERROR_CODES.USER_NOT_FOUND;
    error.status = 404;
    throw error;
  }

  // Atomically consume the code so concurrent requests cannot reuse it.
  const otp = await Otp.findOneAndDelete({
    email,
    code,
    purpose: "reset_password",
    expiresAt: { $gt: new Date() },
  });
  if (!otp) {
    throw appError(ERROR_CODES.OTP_INVALID, 400);
  }

  if (await user.comparePassword(password)) {
    throw appError(ERROR_CODES.NEW_PASSWORD_MUST_DIFFER, 400);
  }

  user.passwordHash = password;
  user.refreshToken = null;
  user.sessionVersion = (user.sessionVersion ?? 0) + 1;
  await user.save();

  await Otp.deleteMany({ email, purpose: "reset_password" });

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
    // password. The code is created by the existing forgot-password endpoint.
    const otp = await Otp.findOneAndDelete({
      email: user.email,
      code,
      purpose: "reset_password",
      expiresAt: { $gt: new Date() },
    });
    if (!otp) {
      throw appError(ERROR_CODES.OTP_INVALID, 400);
    }
  }

  if (await user.comparePassword(newPassword)) {
    throw appError(ERROR_CODES.NEW_PASSWORD_MUST_DIFFER, 400);
  }

  user.passwordHash = newPassword;
  user.refreshToken = null;
  user.sessionVersion = (user.sessionVersion ?? 0) + 1;
  await user.save();

  await Otp.deleteMany({
    email: user.email,
    purpose: "reset_password",
  });

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
  resetPassword,
  changePassword,
  logout,
};
