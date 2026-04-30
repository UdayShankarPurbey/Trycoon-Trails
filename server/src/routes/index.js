import { Router } from "express";
import { authRoutes } from "./auth.routes.js";
import { userRoutes } from "./user.routes.js";
import { levelRoutes } from "./level.routes.js";
import { worldRoutes } from "./world.routes.js";
import { businessRoutes } from "./business.routes.js";
import { armyRoutes } from "./army.routes.js";
import { battleRoutes } from "./battle.routes.js";
import { missionRoutes } from "./mission.routes.js";
import { adminRoutes } from "./admin.routes.js";
import { notificationRoutes } from "./notification.routes.js";
import { leaderboardRoutes } from "./leaderboard.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/levels", levelRoutes);
router.use("/world", worldRoutes);
router.use("/businesses", businessRoutes);
router.use("/army", armyRoutes);
router.use("/battles", battleRoutes);
router.use("/missions", missionRoutes);
router.use("/notifications", notificationRoutes);
router.use("/leaderboards", leaderboardRoutes);
router.use("/admin", adminRoutes);

export { router as apiV1Router };
