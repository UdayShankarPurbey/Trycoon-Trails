import { Business, BusinessType, Territory } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import { sequelize } from "../config/db.js";
import { debit } from "./economy.service.js";
import { collectForUser } from "./income.service.js";
import { recordEvent } from "./mission.service.js";

const findOwnedTerritory = async (userId, territoryId, { txn = null } = {}) => {
  const territory = await Territory.findByPk(territoryId, { transaction: txn });
  if (!territory) throw ApiError.notFound("Territory not found");
  if (territory.owner_id !== userId) throw ApiError.forbidden("You do not own this territory");
  return territory;
};

export const buyBusiness = async (user, { territoryId, typeId, typeCode }) => {
  return sequelize.transaction(async (txn) => {
    const type = typeCode
      ? await BusinessType.findOne({ where: { code: typeCode }, transaction: txn })
      : await BusinessType.findByPk(typeId, { transaction: txn });

    if (!type) throw ApiError.notFound("Business type not found");
    if (!type.is_active) throw ApiError.badRequest("This business type is not available");
    if (user.level < type.unlock_level) {
      throw ApiError.forbidden(`Requires player level ${type.unlock_level}`);
    }

    const territory = await findOwnedTerritory(user.id, territoryId, { txn });
    const existingCount = await Business.count({
      where: { territory_id: territory.id },
      transaction: txn,
    });
    if (existingCount >= territory.business_capacity) {
      throw ApiError.badRequest(
        `Territory full (${existingCount}/${territory.business_capacity} slots used)`
      );
    }

    const cost = type.costToBuy();
    await debit(user, "coins", cost, `buy_business:${type.code}`, { txn });

    const business = await Business.create(
      {
        territory_id: territory.id,
        type_id: type.id,
        level: 1,
        last_collected_at: new Date(),
      },
      { transaction: txn }
    );

    await recordEvent(user, "buy_business", 1, { txn });

    return { business, type, cost, territory };
  });
};

export const upgradeBusiness = async (user, businessId) => {
  return sequelize.transaction(async (txn) => {
    await collectForUser(user.id, { txn });

    const business = await Business.findByPk(businessId, {
      include: [
        { model: BusinessType, as: "type" },
        { model: Territory, as: "territory" },
      ],
      transaction: txn,
    });
    if (!business) throw ApiError.notFound("Business not found");
    if (business.territory.owner_id !== user.id) {
      throw ApiError.forbidden("You do not own this business");
    }
    if (business.level >= business.type.max_level) {
      throw ApiError.badRequest(`Already at max level (${business.type.max_level})`);
    }

    const cost = business.type.costToUpgrade(business.level);
    await debit(user, "coins", cost, `upgrade_business:${business.type.code}:L${business.level + 1}`, { txn });

    business.level += 1;
    await business.save({ transaction: txn });

    await recordEvent(user, "upgrade_business", 1, { txn });

    return { business, cost };
  });
};

export const listMyBusinesses = async (userId) => {
  return Business.findAll({
    include: [
      { model: BusinessType, as: "type" },
      {
        model: Territory,
        as: "territory",
        where: { owner_id: userId },
        required: true,
      },
    ],
    order: [["created_at", "ASC"]],
  });
};
