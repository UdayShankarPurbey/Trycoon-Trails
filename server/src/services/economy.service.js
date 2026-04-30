import { Transaction } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import { updateScore } from "./leaderboard.service.js";

const BALANCE_FIELD = {
  coins: "coins",
  gems: "gems",
  manpower: "manpower",
  reputation: "reputation",
  xp: "xp",
};

const LEADERBOARD_KINDS = new Set(["coins", "gems", "xp", "reputation"]);
const isUnsigned = (kind) => kind !== "reputation";

export const credit = async (user, kind, amount, reason, { metadata = null, txn = null } = {}) => {
  if (amount <= 0) throw ApiError.badRequest("Credit amount must be positive");
  const field = BALANCE_FIELD[kind];
  if (!field) throw ApiError.badRequest(`Unknown resource kind: ${kind}`);

  const current = Number(user[field]);
  user[field] = current + amount;
  await user.save({ transaction: txn });

  await Transaction.create(
    {
      user_id: user.id,
      kind,
      amount,
      balance_after: user[field],
      reason,
      metadata,
    },
    { transaction: txn }
  );

  if (LEADERBOARD_KINDS.has(kind)) {
    updateScore(user.id, kind, user[field]).catch(() => {});
  }

  return user;
};

export const debit = async (user, kind, amount, reason, { metadata = null, txn = null, allowNegative = false } = {}) => {
  if (amount <= 0) throw ApiError.badRequest("Debit amount must be positive");
  const field = BALANCE_FIELD[kind];
  if (!field) throw ApiError.badRequest(`Unknown resource kind: ${kind}`);

  const current = Number(user[field]);
  if (!allowNegative && isUnsigned(kind) && current < amount) {
    throw ApiError.badRequest(`Insufficient ${kind} (have ${current}, need ${amount})`);
  }

  user[field] = current - amount;
  await user.save({ transaction: txn });

  await Transaction.create(
    {
      user_id: user.id,
      kind,
      amount: -amount,
      balance_after: user[field],
      reason,
      metadata,
    },
    { transaction: txn }
  );

  if (LEADERBOARD_KINDS.has(kind)) {
    updateScore(user.id, kind, user[field]).catch(() => {});
  }

  return user;
};
