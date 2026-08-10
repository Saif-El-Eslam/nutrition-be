import jwt from "jsonwebtoken";

const signRefreshToken = (user) => {
  return jwt.sign(
    {
      user_id: user.id,
      role: user.role,
      session_version: user.sessionVersion ?? 0,
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "30d" },
  );
};

const signAccessToken = (user) => {
  return jwt.sign(
    {
      user_id: user.id,
      role: user.role,
      session_version: user.sessionVersion ?? 0,
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: "1d",
    },
  );
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

export default {
  signRefreshToken,
  signAccessToken,
  verifyAccessToken,
  verifyRefreshToken,
};
