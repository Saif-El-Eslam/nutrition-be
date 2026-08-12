import { body } from "express-validator";
import { ERROR_CODES, translate } from "#utils/localization.js";

const signup = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage(["REQUIRED_FIELD", { field: "firstName" }])
    .isLength({ min: 2 })
    .withMessage(["INVALID_LENGTH", { min: 2 }]),
  body("lastName")
    .trim()
    .notEmpty()
    .withMessage(["REQUIRED_FIELD", { field: "lastName" }])
    .isLength({ min: 2 })
    .withMessage(["INVALID_LENGTH", { min: 2 }]),
  body("email")
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage(["REQUIRED_FIELD", { field: "email" }])
    .isEmail()
    .withMessage(["INVALID_EMAIL"]),
  body("phone")
    .notEmpty()
    .withMessage(["REQUIRED_FIELD", { field: "phone" }])
    .isMobilePhone("ar-EG")
    .withMessage(["INVALID_PHONE_FORMAT"]),
  body("password")
    .isLength({ min: 8, max: 72 })
    .withMessage(["INVALID_LENGTH", { field: "password", min: 8, max: 72 }])
    .custom((value) => Buffer.byteLength(value, "utf8") <= 72)
    .withMessage(["PASSWORD_TOO_LONG"]),
  //   body("role")
  //     .optional()
  //     .isIn(["customer", "specialist", "admin"])
  //     .withMessage("Role is invalid"),
  //   body("specialistInfo.specialization")
  //     .if(body("role").equals("specialist"))
  //     .notEmpty()
  //     .withMessage("specialistInfo.specialization is required")
  //     .isLength({ min: 3 })
  //     .withMessage(
  //       "specialistInfo.specialization must be at least 3 characters long",
  //     ),
  //   body("specialistInfo.experienceYears")
  //     .if(body("role").equals("specialist"))
  //     .notEmpty()
  //     .withMessage("specialistInfo.experienceYears is required")
  //     .isInt({ min: 0 })
  //     .withMessage(
  //       "specialistInfo.experienceYears must be a non-negative integer",
  //     ),
];

const login = [
  // one of email and phone is required
  body().custom((value, { req }) => {
    if (!req?.body?.email && !req?.body?.phone) {
      throw ["EITHER_EMAIL_OR_PHONE_REQUIRED"];
    }
    return true;
  }),
  body("password")
    .notEmpty()
    .withMessage(["REQUIRED_FIELD", { field: "password" }])
    .isLength({ min: 1, max: 72 })
    .withMessage(["INVALID_LENGTH", { field: "password", min: 1, max: 72 }]),
];

const googleCredential = [
  body("credential")
    .notEmpty()
    .withMessage(["REQUIRED_FIELD", { field: "credential" }])
    .isString()
    .withMessage(["INVALID_FORMAT", { field: "credential" }])
    .isLength({ min: 100, max: 10000 })
    .withMessage([
      "INVALID_LENGTH",
      { field: "credential", min: 100, max: 10000 },
    ]),
];

const sendOtp = [
  body("email")
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage(["REQUIRED_FIELD", { field: "email" }])
    .isEmail()
    .withMessage(["INVALID_EMAIL"]),
];

const verifyOtp = [
  body("email")
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage(["REQUIRED_FIELD", { field: "email" }])
    .isEmail()
    .withMessage(["INVALID_EMAIL"]),
  body("code")
    .trim()
    .notEmpty()
    .withMessage(["REQUIRED_FIELD", { field: "code" }])
    .isLength({ min: 6, max: 6 })
    .withMessage(["INVALID_LENGTH", { min: 6, max: 6 }]),
];

// Refresh token is read exclusively from the httpOnly cookie.
// No body field is accepted or validated.
const refreshToken = [];

const forgotPassword = [
  body("email")
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage(["REQUIRED_FIELD", { field: "email" }])
    .isEmail()
    .withMessage(["INVALID_EMAIL"]),
];

const resetPassword = [
  body("resetToken")
    .notEmpty()
    .withMessage(["REQUIRED_FIELD", { field: "resetToken" }])
    .isString()
    .withMessage(["INVALID_FORMAT", { field: "resetToken" }])
    .matches(/^[A-Za-z0-9_-]{43}$/)
    .withMessage(["INVALID_FORMAT", { field: "resetToken" }]),
  body("newPassword")
    .notEmpty()
    .withMessage(["REQUIRED_FIELD", { field: "newPassword" }])
    .isLength({ min: 8, max: 72 })
    .withMessage([
      "INVALID_LENGTH",
      { field: "newPassword", min: 8, max: 72 },
    ])
    .custom((value) => Buffer.byteLength(value, "utf8") <= 72)
    .withMessage(["PASSWORD_TOO_LONG"]),
];

const verifyResetOtp = [
  body("email")
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage(["REQUIRED_FIELD", { field: "email" }])
    .isEmail()
    .withMessage(["INVALID_EMAIL"]),
  body("otp")
    .trim()
    .matches(/^\d{6}$/)
    .withMessage(["OTP_CODE_INVALID_LENGTH"]),
];

const changePassword = [
  body("currentPassword")
    .optional()
    .isString()
    .withMessage(["INVALID_FORMAT", { field: "currentPassword" }])
    .notEmpty()
    .withMessage(["REQUIRED_FIELD", { field: "currentPassword" }])
    .isLength({ min: 1, max: 72 })
    .withMessage([
      "INVALID_LENGTH",
      { field: "currentPassword", min: 1, max: 72 },
    ]),
  body("code")
    .optional()
    .trim()
    .matches(/^\d{6}$/)
    .withMessage(["OTP_CODE_INVALID_LENGTH"]),
  body("newPassword")
    .notEmpty()
    .withMessage(["REQUIRED_FIELD", { field: "newPassword" }])
    .isString()
    .withMessage(["INVALID_FORMAT", { field: "newPassword" }])
    .isLength({ min: 8, max: 72 })
    .withMessage(["INVALID_LENGTH", { field: "newPassword", min: 8, max: 72 }])
    .custom((value) => Buffer.byteLength(value, "utf8") <= 72)
    .withMessage(["PASSWORD_TOO_LONG"]),
];

const logout = [];

export default {
  signup,
  login,
  googleCredential,
  refreshToken,
  logout,
  sendOtp,
  verifyOtp,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  changePassword,
};
