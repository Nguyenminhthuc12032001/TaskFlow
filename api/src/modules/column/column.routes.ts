import { Router } from "express";
import { ColumnController } from "./column.controller.js";

const columnController = new ColumnController();

const router = Router();

router.post("/:workspaceId/:projectId", columnController.create);

router.get("/:workspaceId/:projectId", columnController.listByProject);

router.get("/:workspaceId/:projectId/:columnId", columnController.get);

router.patch("/:workspaceId/:projectId/re_order", columnController.reOrder);

router.patch("/:workspaceId/:projectId/:columnId", columnController.update);

router.delete("/:workspaceId/:projectId/:columnId", columnController.remove);

export default router;