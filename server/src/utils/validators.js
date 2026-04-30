import { ApiError } from "./ApiError.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,32}$/;

export const isEmail = (v) => typeof v === "string" && EMAIL_RE.test(v);

export const isUsername = (v) => typeof v === "string" && USERNAME_RE.test(v);

export const isStrongPassword = (v) => {
  if (typeof v !== "string" || v.length < 8 || v.length > 72) return false;
  const hasLetter = /[A-Za-z]/.test(v);
  const hasDigit = /\d/.test(v);
  return hasLetter && hasDigit;
};

export const validateSignup = ({ username, email, password }) => {
  const errors = [];
  if (!isUsername(username)) {
    errors.push({ field: "username", message: "Username must be 3-32 chars, letters/digits/underscore" });
  }
  if (!isEmail(email)) {
    errors.push({ field: "email", message: "Invalid email format" });
  }
  if (!isStrongPassword(password)) {
    errors.push({ field: "password", message: "Password must be 8-72 chars and contain letters + digits" });
  }
  if (errors.length) throw ApiError.unprocessable("Invalid signup payload", errors);
};

export const validateLogin = ({ identifier, password }) => {
  const errors = [];
  if (!identifier || typeof identifier !== "string") {
    errors.push({ field: "identifier", message: "Username or email is required" });
  }
  if (!password || typeof password !== "string") {
    errors.push({ field: "password", message: "Password is required" });
  }
  if (errors.length) throw ApiError.unprocessable("Invalid login payload", errors);
};
