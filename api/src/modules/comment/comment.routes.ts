import { Router } from "express";
import { CommentController } from "./comment.controller.js";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { requireWorkspaceRole } from "../../common/middlewares/requireWorkspaceRole.middleware.js";
import { validateBody } from "../../common/middlewares/validateBody.middleware.js";
import { createBodySchema, updateBodySchema } from "./comment.schemas.js";
import { emptyBodySchema } from "../../common/schemas/common.schemas.js";

const commentControlelr = new CommentController();

const router = Router();

const defaultRoute = "/:workspaceId/:projectId/:columnId/:taskId"

router.post(defaultRoute,
    authMiddleware,
    requireWorkspaceRole("member"),
    validateBody(createBodySchema), commentControlelr.create);

router.post(defaultRoute + "/reply",
    authMiddleware,
    requireWorkspaceRole("member"),
    validateBody(createBodySchema), commentControlelr.reply);

router.get(defaultRoute + "/:commentId",
    authMiddleware,
    requireWorkspaceRole(),
    validateBody(emptyBodySchema), commentControlelr.get);

router.get(defaultRoute,
    authMiddleware,
    requireWorkspaceRole(),
    validateBody(emptyBodySchema), commentControlelr.listByTask);

router.patch(defaultRoute + "/:commentId",
    authMiddleware,
    requireWorkspaceRole("member"),
    validateBody(updateBodySchema), commentControlelr.update);

router.delete(defaultRoute + "/:commentId",
    authMiddleware,
    requireWorkspaceRole("member"),
    validateBody(emptyBodySchema), commentControlelr.remove);

export default router;