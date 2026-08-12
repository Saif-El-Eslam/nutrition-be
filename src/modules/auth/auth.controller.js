import { getLanguage, translate } from "#utils/localization.js";
import { setCookies, clearCookies } from "#utils/cookies.js";
import authService from "./auth.service.js";

const sendOtp = async (req, res, next) => {
  try {
    const result = await authService.sendOtp(req.body);
    res.json({
      message: translate("OTP_SENT_SUCCESS", getLanguage(req)),
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const result = await authService.verifyOtp(req.body);
    res.json({
      message: translate("OTP_VERIFIED_SUCCESS", getLanguage(req)),
    });
  } catch (error) {
    next(error);
  }
};

const signup = async (req, res, next) => {
  try {
    const result = await authService.signup(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    setCookies(res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });

    // Tokens are delivered via httpOnly cookies only — not exposed in the body.
    res.json({ success: true, data: result.user });
  } catch (error) {
    next(error);
  }
};

const googleSignIn = async (req, res, next) => {
  try {
    const result = await authService.googleSignIn(req.body);
    setCookies(res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });

    res.status(result.isNewUser ? 201 : 200).json({
      success: true,
      data: result.user,
      meta: {
        isNewUser: result.isNewUser,
        needsProfileCompletion: !result.user.phone,
        passwordLoginAvailable: result.passwordLoginAvailable,
      },
    });
  } catch (error) {
    next(error);
  }
};

const linkGoogleAccount = async (req, res, next) => {
  try {
    const user = await authService.linkGoogleAccount(
      req.user.user_id,
      req.body,
    );
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    // HTTP-only cookie is the only accepted source for the refresh token.
    // Body fallback is intentionally disabled.
    const token = req.cookies?.refreshToken;
    if (!token) {
      const lang = getLanguage(req);
      return res.status(401).json({
        success: false,
        code: "INVALID_REFRESH_TOKEN",
        message: translate("INVALID_REFRESH_TOKEN", lang),
      });
    }
    const result = await authService.refreshToken(token);
    // Rotate cookies: set new access + refresh token cookies
    setCookies(res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
    // Tokens are delivered via httpOnly cookies only — not exposed in the body.
    res.json({ success: true, data: result.user });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.user_id);
    // Clear both httpOnly cookies regardless of which auth method the client used
    clearCookies(res);
    res.json({ message: translate("LOGOUT_SUCCESS", getLanguage(req)) });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body);
    res.json({
      message: translate("OTP_SENT_SUCCESS", getLanguage(req)),
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const verifyResetOtp = async (req, res, next) => {
  try {
    const result = await authService.verifyResetOtp(req.body);
    res.json({
      message: translate("OTP_VERIFIED_SUCCESS", getLanguage(req)),
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body);
    clearCookies(res);
    res.json({
      message: translate("PASSWORD_RESET_SUCCESS", getLanguage(req)),
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const result = await authService.changePassword(req.user.user_id, req.body);
    setCookies(res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
    res.json({
      success: true,
      message: translate("PASSWORD_CHANGED_SUCCESS", getLanguage(req)),
      data: result.user,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  signup,
  login,
  googleSignIn,
  linkGoogleAccount,
  refreshToken,
  logout,
  sendOtp,
  verifyOtp,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  changePassword,
};
