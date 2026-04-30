import { Router } from "express";
import { authRoutes } from "./auth.routes.js";
import { userRoutes } from "./user.routes.js";
import { levelRoutes } from "./level.routes.js";
import { worldRoutes } from "./world.routes.js";
import { businessRoutes } from "./business.routes.js";
import { armyRoutes } from "./army.routes.js";
import { battleRoutes } from "./battle.routes.js";
import { missionRoutes } from "./mission.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/levels", levelRoutes);
router.use("/world", worldRoutes);
router.use("/businesses", businessRoutes);
router.use("/army", armyRoutes);
router.use("/battles", battleRoutes);
router.use("/missions", missionRoutes);

export { router as apiV1Router };
