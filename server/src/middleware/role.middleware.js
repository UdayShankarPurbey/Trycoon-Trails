import { ApiError } from "../utils/ApiError.js";

export const requireRole = (...allowed) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized("Authentication required"));
  if (!allowed.includes(req.user.role)) {
    return next(ApiError.forbidden(`Requires role: ${allowed.join(" or ")}`));
  }
  next();
};

export const requireAdmin = requireRole("admin");
