import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
import { env } from "../config/env.js";

export const notFoundHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, _next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode && Number.isInteger(error.statusCode)
        ? error.statusCode
        : error.name === "SequelizeValidationError" ||
          error.name === "SequelizeUniqueConstraintError"
        ? 400
        : 500;

    const message = error.message || "Internal server error";
    const errors =
      error.errors && Array.isArray(error.errors)
        ? error.errors.map((e) => ({
            field: e.path || e.field,
            message: e.message,
          }))
        : [];

    error = new ApiError(statusCode, message, errors, err.stack);
  }

  if (error.statusCode >= 500) {
    logger.error(
      `[${req.method} ${req.originalUrl}] ${error.message}`,
      { stack: error.stack }
    );
  } else {
    logger.warn(
      `[${req.method} ${req.originalUrl}] ${error.statusCode} ${error.message}`
    );
  }

  const body = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors,
  };

  if (env.isDev) {
    body.stack = error.stack;
  }

  res.status(error.statusCode).json(body);
};
