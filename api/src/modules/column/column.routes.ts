import { Router } from "express";
import { ColumnController } from "./column.controller.js";
import { ColumnService } from "./column.service.js";
import { prisma } from "../../db/prisma.js";
import { ColumnRepo } from "./column.repo.js";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { requireWorkspaceRole } from "../../common/middlewares/requireWorkspaceRole.middleware.js";
import { validateBody } from "../../common/middlewares/validateBody.middleware.js";
import { createBodySchema, reOrderBodySchema, updateBodySchema } from "./column.schemas.js";
import { ActivityService } from "../activity/activity.service.js";
import { ActivityRepo } from "../activity/activity.repo.js";
import { emptyBodySchema } from "../../common/schemas/common.schemas.js";

const columnController = new ColumnController(
    new ColumnService(
        prisma,
        new ColumnRepo(
            prisma
        ),
        new ActivityService(
            new ActivityRepo()
        )
    )
);

const router = Router();

router.post("/:workspaceId/:projectId",
    authMiddleware, requireWorkspaceRole("admin"), validateBody(createBodySchema),
    columnController.create);

router.get("/:workspaceId/:projectId",
    authMiddleware, requireWorkspaceRole(), validateBody(emptyBodySchema),
    columnController.listByProject);

router.get("/:workspaceId/:projectId/:columnId",
    authMiddleware, requireWorkspaceRole(), validateBody(emptyBodySchema),
    columnController.get);

router.patch("/:workspaceId/:projectId/re_order",
    authMiddleware, requireWorkspaceRole("admin"), validateBody(reOrderBodySchema),
    columnController.reOrder);

router.patch("/:workspaceId/:projectId/:columnId",
    authMiddleware, requireWorkspaceRole("admin"), validateBody(updateBodySchema),
    columnController.update);

router.delete("/:workspaceId/:projectId/:columnId",
    authMiddleware, requireWorkspaceRole("admin"), validateBody(emptyBodySchema),
    columnController.remove);

export default router;