import schedule from "node-schedule";
import { redis } from "../config/redis.js";
import { runIncomeTick } from "../services/income.service.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

const LOCK_KEY = "tick:income:lock";
const LOCK_TTL_SECONDS = 50;

let job = null;

const tick = async () => {
  const lock = await redis.set(LOCK_KEY, "1", "EX", LOCK_TTL_SECONDS, "NX");
  if (!lock) {
    logger.debug("Income tick: skipped (another instance has the lock)");
    return;
  }

  const start = Date.now();
  try {
    const { usersProcessed, totalCredited, totalUpkeepPaid, totalManpowerRegen } = await runIncomeTick();
    const ms = Date.now() - start;
    if (usersProcessed > 0) {
      logger.info(
        `Income tick: ${usersProcessed} users | +${totalCredited} coins | -${totalUpkeepPaid} upkeep | +${totalManpowerRegen} manpower (${ms}ms)`
      );
    } else {
      logger.debug(`Income tick: idle (${ms}ms)`);
    }
  } catch (err) {
    logger.error(`Income tick error: ${err.message}`);
  } finally {
    await redis.del(LOCK_KEY).catch(() => {});
  }
};

export const startIncomeTick = () => {
  if (!env.incomeTick.enabled) {
    logger.warn("Income tick disabled (INCOME_TICK_ENABLED=false)");
    return;
  }
  if (job) return;
  job = schedule.scheduleJob(env.incomeTick.cron, tick);
  logger.info(`Income tick scheduled: cron="${env.incomeTick.cron}"`);
};

export const stopIncomeTick = async () => {
  if (job) {
    await job.cancel();
    job = null;
    logger.info("Income tick stopped");
  }
};
