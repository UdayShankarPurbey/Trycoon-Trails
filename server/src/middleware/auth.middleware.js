import { ApiError } from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { User } from "../models/index.js";

const extractToken = (req) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) return auth.slice(7);
  if (req.cookies?.accessToken) return req.cookies.accessToken;
  return null;
};

export const authenticate = async (req, _res, next) => {
  try {
    const token = extractToken(req);
    if (!token) throw ApiError.unauthorized("Missing access token");

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        throw ApiError.unauthorized("Access token expired");
      }
      throw ApiError.unauthorized("Invalid access token");
    }

    const user = await User.findByPk(payload.sub);
    if (!user) throw ApiError.unauthorized("User not found");
    if (user.is_banned) throw ApiError.forbidden(user.banned_reason || "Account is banned");

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    next(err);
  }
};
