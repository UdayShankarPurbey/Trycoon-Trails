import { Transaction } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const listMyTransactions = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const offset = parseInt(req.query.offset, 10) || 0;
  const kind = req.query.kind;

  const where = { user_id: req.user.id };
  if (kind) where.kind = kind;

  const { rows, count } = await Transaction.findAndCountAll({
    where,
    order: [["created_at", "DESC"]],
    limit,
    offset,
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        total: count,
        limit,
        offset,
        items: rows,
      },
      "OK"
    )
  );
});
