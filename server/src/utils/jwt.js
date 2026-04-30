import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env.js";

export const signAccessToken = (user) =>
  jwt.sign(
    { sub: user.id, role: user.role, username: user.username },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpiry }
  );

export const signRefreshToken = (user) => {
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    { sub: user.id, jti },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiry }
  );
  return { token, jti };
};

export const verifyAccessToken = (token) =>
  jwt.verify(token, env.jwt.accessSecret);

export const verifyRefreshToken = (token) =>
  jwt.verify(token, env.jwt.refreshSecret);
