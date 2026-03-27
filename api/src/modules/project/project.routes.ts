import { Router } from "express";
import { ProjectController } from "./project.controller.js";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { requireWorkspaceRole } from "../../common/middlewares/requireWorkspaceRole.middleware.js";
import { ProjectService } from "./project.service.js";
import { ProjectRepo } from "./project.repo.js";
import { prisma } from "../../db/prisma.js";
import { validateBody } from "../../common/middlewares/validateBody.middleware.js";
import { createBodySchema, updateBodySchema } from "./project.schemas.js";
import { ActivityService } from "../activity/activity.service.js";
import { ActivityRepo } from "../activity/activity.repo.js";
import { emptyBodySchema } from "../../common/schemas/common.schemas.js";

const projectController = new ProjectController(
    new ProjectService(
        prisma, // this prisma is use for transaction
        new ProjectRepo(
            prisma
        ),
        new ActivityService(
            new ActivityRepo()
        )
    )
);

const router = Router();

router.post("/:workspaceId",
    authMiddleware,
    requireWorkspaceRole("admin"),
    validateBody(createBodySchema), projectController.create);

router.get("/:workspaceId",
    authMiddleware,
    requireWorkspaceRole(),
    validateBody(emptyBodySchema), projectController.listByWorkspace);

router.get("/:workspaceId/:projectId",
    authMiddleware,
    requireWorkspaceRole(),
    validateBody(emptyBodySchema), projectController.get);

router.patch("/:workspaceId/:projectId",
    authMiddleware,
    requireWorkspaceRole("admin"),
    validateBody(updateBodySchema), projectController.update);

router.delete("/:workspaceId/:projectId",
    authMiddleware,
    requireWorkspaceRole("admin"),
    validateBody(emptyBodySchema), projectController.remove);

export default router;
