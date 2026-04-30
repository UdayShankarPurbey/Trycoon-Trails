import { Sequelize } from "sequelize";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

export const sequelize = new Sequelize(
  env.db.name,
  env.db.user,
  env.db.password,
  {
    host: env.db.host,
    port: env.db.port,
    dialect: env.db.dialect,
    logging: env.isDev ? (msg) => logger.debug(msg) : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      underscored: true,
      timestamps: true,
      freezeTableName: false,
    },
  }
);

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info(
      `MySQL connected: ${env.db.user}@${env.db.host}:${env.db.port}/${env.db.name}`
    );
  } catch (err) {
    logger.error(`MySQL connection failed: ${err.message}`);
    throw err;
  }
};

export const disconnectDB = async () => {
  try {
    await sequelize.close();
    logger.info("MySQL disconnected");
  } catch (err) {
    logger.error(`MySQL disconnect error: ${err.message}`);
  }
};
