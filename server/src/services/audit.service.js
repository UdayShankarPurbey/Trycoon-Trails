import { AuditLog } from "../models/index.js";
import { logger } from "../utils/logger.js";

export const recordAudit = async ({ adminId, action, targetTable, targetId = null, payload = null, ip = null }, { txn = null } = {}) => {
  try {
    return await AuditLog.create(
      {
        admin_id: adminId,
        action,
        target_table: targetTable,
        target_id: targetId !== null && targetId !== undefined ? String(targetId) : null,
        payload,
        ip,
      },
      { transaction: txn }
    );
  } catch (err) {
    logger.error(`Audit log failed: ${err.message}`);
    return null;
  }
};
