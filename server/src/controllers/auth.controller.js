import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {
  signupService,
  loginService,
  issueTokens,
  refreshService,
  logoutService,
  changePasswordService,
} from "../services/auth.service.js";
import { validateSignup, validateLogin, isStrongPassword } from "../utils/validators.js";
import { env } from "../config/env.js";
import ms from "ms";

const refreshCookieOpts = () => ({
  httpOnly: true,
  secure: env.isProd,
  sameSite: env.isProd ? "strict" : "lax",
  maxAge: ms(env.jwt.refreshExpiry),
  path: "/api/v1/auth",
});

const accessCookieOpts = () => ({
  httpOnly: true,
  secure: env.isProd,
  sameSite: env.isProd ? "strict" : "lax",
  maxAge: ms(env.jwt.accessExpiry),
  path: "/",
});

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, accessCookieOpts());
  res.cookie("refreshToken", refreshToken, refreshCookieOpts());
};

const clearAuthCookies = (res) => {
  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie("refreshToken", { path: "/api/v1/auth" });
};

export const signup = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body || {};
  validateSignup({ username, email, password });

  const { user, territory } = await signupService({ username, email, password });
  const { accessToken, refreshToken } = await issueTokens(user);

  setAuthCookies(res, accessToken, refreshToken);
  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { user: user.toSafeJSON(), territory, accessToken, refreshToken },
        "Signup successful"
      )
    );
});

export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body || {};
  validateLogin({ identifier, password });

  const { user, accessToken, refreshToken } = await loginService({ identifier, password });

  setAuthCookies(res, accessToken, refreshToken);
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: user.toSafeJSON(), accessToken, refreshToken },
        "Login successful"
      )
    );
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  const { user, accessToken, refreshToken: newRefresh } = await refreshService(refreshToken);

  setAuthCookies(res, accessToken, newRefresh);
  res.status(200).json(
    new ApiResponse(
      200,
      { user: user.toSafeJSON(), accessToken, refreshToken: newRefresh },
      "Token refreshed"
    )
  );
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  await logoutService(refreshToken);
  clearAuthCookies(res);
  res.status(200).json(new ApiResponse(200, null, "Logged out"));
});

export const me = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, { user: req.user.toSafeJSON() }, "OK"));
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    throw ApiError.unprocessable("Both currentPassword and newPassword are required");
  }
  if (!isStrongPassword(newPassword)) {
    throw ApiError.unprocessable("New password must be 8-72 chars with letters + digits");
  }
  await changePasswordService(req.user, { currentPassword, newPassword });
  res.status(200).json(new ApiResponse(200, null, "Password changed"));
});
