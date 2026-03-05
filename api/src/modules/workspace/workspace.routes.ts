import { Router } from 'express';
import { WorkspaceController } from './workspace.controller.js';
import { authMiddleware } from '../../common/middlewares/auth.middleware.js';
import { requireWorkspaceMember } from '../../common/middlewares/requireWorkspaceMember.middleware.js';
import { WorkspaceService } from './workspace.service.js';
import { EmailService } from '../mail/mail.service.js';
import { WorkspaceRepo } from './workspace.repo.js';
import { AuthRepo } from '../auth/auth.repo.js';
import { ActivityService } from '../activity/activity.service.js';
import { prisma } from '../../db/prisma.js';
import { ActivityRepo } from '../activity/activity.repo.js';
import { validateBody } from '../../common/middlewares/validateBody.middleware.js';
import { acceptBodySchema, createBodySchema, deleteBodySchema, getByIdBodySchema, getByUserIdBodySchema, getMembersBodySchema, inviteBodySchema, removeMemberBodySchema, updateBodySchema } from './workspace.schemas.js';

const router = Router();

const workspaceController = new WorkspaceController(
    new WorkspaceService(
        new EmailService(),
        new WorkspaceRepo(),
        new AuthRepo(),
        new ActivityService(
            new ActivityRepo
        ),
        prisma
    )
)

router.post('/create',
    authMiddleware, validateBody(createBodySchema),
    workspaceController.create);

router.get("/list",
    authMiddleware, validateBody(getByUserIdBodySchema), requireWorkspaceMember,
    workspaceController.getByUserId);

router.get("/:workspaceId",
    authMiddleware, validateBody(getByIdBodySchema), requireWorkspaceMember,
    workspaceController.getById);

router.get("/members/:workspaceId",
    authMiddleware, validateBody(getMembersBodySchema), requireWorkspaceMember,
    workspaceController.getMembersById);

router.put("/:workspaceId",
    authMiddleware, validateBody(updateBodySchema), requireWorkspaceMember("admin"),
    workspaceController.update);

router.delete("/:workspaceId",
    authMiddleware, validateBody(deleteBodySchema), requireWorkspaceMember("admin"),
    workspaceController.remove);

router.post("/invite/:workspaceId",
    authMiddleware, validateBody(inviteBodySchema), requireWorkspaceMember("admin"),
    workspaceController.invinte);

router.post("/accept_invite",
    authMiddleware, validateBody(acceptBodySchema),
    workspaceController.accept);

router.delete("/remove_member/:workspaceId/:memberId",
    authMiddleware,
    validateBody(removeMemberBodySchema), requireWorkspaceMember("member"),
    workspaceController.removeMember);

export default router;