import env from "#config/env.js";
import jwt from "#utils/jwt.js";
import { getLanguage, ERROR_CODES, translate } from "#utils/localization.js";
import User from "#models/user.js";

const authenticate = async (req, res, next) => {
  // HTTP-only cookie is the only accepted auth mechanism.
  // Bearer token header fallback is intentionally disabled.

  const token = req.cookies?.accessToken;

  if (!token) {
    const lang = getLanguage(req);

    return res.status(401).json({
      success: false,
      code: ERROR_CODES.INVALID_TOKEN,
      message: translate(ERROR_CODES.INVALID_TOKEN, lang),
    });
  }

  try {
    const decoded = jwt.verifyAccessToken(token);
    const user = await User.findById(decoded.user_id).select(
      "+sessionVersion role",
    );
    const tokenSessionVersion = decoded.session_version ?? 0;
    const currentSessionVersion = user?.sessionVersion ?? 0;

    if (!user || tokenSessionVersion !== currentSessionVersion) {
      throw new Error("Session has been invalidated");
    }

    req.user = {
      ...decoded,
      role: user.role,
    };

    // Update lastSeen asynchronously — do not block the request
    User.updateOne({ _id: user._id }, { lastSeen: new Date() }).exec();

    next();
  } catch {
    const lang = getLanguage(req);

    return res.status(401).json({
      success: false,
      code: ERROR_CODES.INVALID_TOKEN,
      message: translate(ERROR_CODES.INVALID_TOKEN, lang),
    });
  }
};

export default authenticate;
