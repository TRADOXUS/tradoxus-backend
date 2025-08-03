import { Router } from "express";
import { StrategyController } from "../controllers/StrategyController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();
const controller = new StrategyController();

router.use(authMiddleware);

router.post("/", (req, res, next) => controller.create(req, res).catch(next));
router.get("/", (req, res, next) => controller.list(req, res).catch(next));
router.get("/indicators", (req, res, next) =>
  controller.getIndicators(req, res).catch(next),
);
router.get("/:id", (req, res, next) =>
  controller.getById(req, res).catch(next),
);
router.put("/:id", (req, res, next) => controller.update(req, res).catch(next));
router.delete("/:id", (req, res, next) =>
  controller.delete(req, res).catch(next),
);

export default router;
