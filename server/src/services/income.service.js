import { Op } from "sequelize";
import { Business, BusinessType, Territory, User } from "../models/index.js";
import { sequelize } from "../config/db.js";
import { credit, debit } from "./economy.service.js";
import { regenManpower, computeUserUpkeepPerMin } from "./army.service.js";
import { logger } from "../utils/logger.js";

const HOURS = (n) => n * 60 * 60 * 1000;
const DAYS = (n) => HOURS(24 * n);

export const idleFactor = (lastActiveAt) => {
  if (!lastActiveAt) return 1;
  const elapsed = Date.now() - new Date(lastActiveAt).getTime();
  if (elapsed < DAYS(7)) return 1.0;
  if (elapsed < DAYS(14)) return 0.8;
  if (elapsed < DAYS(30)) return 0.5;
  return 0.2;
};

export const computeBusinessIncome = (business, territory, user, now = new Date()) => {
  const type = business.type;
  if (!type) return { earned: 0, minutes: 0 };

  const lastCollected = new Date(business.last_collected_at);
  const minutes = Math.max(0, (now - lastCollected) / 60000);
  const perMin = type.incomeAtLevel(business.level);
  const territoryMult = territory ? Number(territory.income_multiplier) : 1;
  const idle = idleFactor(user?.last_active_at);
  const earned = Math.floor(perMin * territoryMult * idle * minutes);
  return { earned, minutes, perMin };
};

const businessFullInclude = [
  { model: BusinessType, as: "type" },
  {
    model: Territory,
    as: "territory",
    include: [{ model: User, as: "owner" }],
  },
];

export const collectForUser = async (userId, { txn = null } = {}) => {
  const businesses = await Business.findAll({
    include: [
      { model: BusinessType, as: "type" },
      {
        model: Territory,
        as: "territory",
        where: { owner_id: userId },
        required: true,
        include: [{ model: User, as: "owner" }],
      },
    ],
    transaction: txn,
  });

  if (businesses.length === 0) return { earned: 0, businesses: 0 };

  const user = businesses[0].territory.owner;
  const now = new Date();
  let totalEarned = 0;
  const breakdown = [];

  for (const b of businesses) {
    const { earned, minutes } = computeBusinessIncome(b, b.territory, user, now);
    totalEarned += earned;
    breakdown.push({ businessId: b.id, type: b.type.code, level: b.level, earned, minutes });
    b.last_collected_at = now;
    await b.save({ transaction: txn });
  }

  if (totalEarned > 0) {
    await credit(user, "coins", totalEarned, "income_tick", {
      metadata: { businesses: businesses.length, breakdown },
      txn,
    });
  }

  return { earned: totalEarned, businesses: businesses.length, breakdown };
};

export const collectSingleBusiness = async (business) => {
  const territory = await business.getTerritory({ include: [{ model: User, as: "owner" }] });
  if (!territory) return { earned: 0 };
  const user = territory.owner;
  const now = new Date();
  const { earned, minutes } = computeBusinessIncome(business, territory, user, now);
  business.last_collected_at = now;
  await business.save();
  if (earned > 0) {
    await credit(user, "coins", earned, "manual_collect", {
      metadata: { businessId: business.id, minutes },
    });
  }
  return { earned, minutes };
};

export const runIncomeTick = async () => {
  const ownerIds = await Territory.findAll({
    attributes: [[sequelize.fn("DISTINCT", sequelize.col("owner_id")), "owner_id"]],
    where: { owner_id: { [Op.not]: null } },
    raw: true,
  });

  let totalCredited = 0;
  let totalUpkeepPaid = 0;
  let totalManpowerRegen = 0;
  let usersProcessed = 0;

  for (const { owner_id } of ownerIds) {
    if (!owner_id) continue;
    try {
      const summary = await sequelize.transaction(async (txn) => {
        const user = await User.findByPk(owner_id, { transaction: txn });
        if (!user) return { earned: 0, upkeep: 0, regen: 0 };

        const regenResult = await regenManpower(user, { txn });
        const incomeResult = await collectForUser(owner_id, { txn });
        const upkeepDue = await computeUserUpkeepPerMin(owner_id, { txn });
        let upkeepPaid = 0;
        if (upkeepDue > 0) {
          await user.reload({ transaction: txn });
          upkeepPaid = Math.min(upkeepDue, Number(user.coins));
          if (upkeepPaid > 0) {
            await debit(user, "coins", upkeepPaid, "upkeep_tick", {
              txn,
              metadata: { full: upkeepDue, paid: upkeepPaid },
            });
          }
        }
        return {
          earned: incomeResult.earned,
          upkeep: upkeepPaid,
          regen: regenResult.regenerated,
        };
      });
      if (summary.earned > 0 || summary.upkeep > 0 || summary.regen > 0) {
        usersProcessed += 1;
        totalCredited += summary.earned;
        totalUpkeepPaid += summary.upkeep;
        totalManpowerRegen += summary.regen;
      }
    } catch (err) {
      logger.error(`Income tick failed for user ${owner_id}: ${err.message}`);
    }
  }

  return { usersProcessed, totalCredited, totalUpkeepPaid, totalManpowerRegen };
};

export { businessFullInclude };
