import { Router } from "express";
import { ProjectController } from "./project.controller.js";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { requireWorkspaceRole } from "../../common/middlewares/requireWorkspaceRole.middleware.js";
import { ProjectService } from "./project.service.js";
import { ProjectRepo } from "./project.repo.js";
import { prisma } from "../../db/prisma.js";
import { validateBody } from "../../common/middlewares/validateBody.middleware.js";
import { createBodySchema, getBodySchema, listByWorkspaceBodySchema, removeBodySchema, updateBodySchema } from "./project.schemas.js";
import { ActivityService } from "../activity/activity.service.js";
import { ActivityRepo } from "../activity/activity.repo.js";

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

router.post("/:workspaceId/create",
    authMiddleware,
    requireWorkspaceRole("admin"),
    validateBody(createBodySchema), projectController.create);

router.get("/:workspaceId/list_by_workspace",
    authMiddleware,
    requireWorkspaceRole(),
    validateBody(listByWorkspaceBodySchema), projectController.listByWorkspace);

router.get("/:workspaceId/:projectId",
    authMiddleware,
    requireWorkspaceRole(),
    validateBody(getBodySchema), projectController.get);

router.put("/:workspaceId/update/:projectId",
    authMiddleware,
    requireWorkspaceRole("admin"),
    validateBody(updateBodySchema), projectController.update);

router.delete("/:workspaceId/remove/:projectId",
    authMiddleware,
    requireWorkspaceRole("admin"),
    validateBody(removeBodySchema), projectController.remove);

export default router;
