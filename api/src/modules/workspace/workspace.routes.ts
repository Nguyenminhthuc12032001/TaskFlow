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

router.post('/create', authMiddleware, workspaceController.create);
router.get("/list", authMiddleware, requireWorkspaceMember, workspaceController.getByUserId);
router.get("/:id", authMiddleware, requireWorkspaceMember, workspaceController.getById);
router.put("/:id", authMiddleware, requireWorkspaceMember("admin"), workspaceController.update);
router.delete("/:id", authMiddleware, requireWorkspaceMember("admin"), workspaceController.remove);
router.post("/:id/invite", authMiddleware, requireWorkspaceMember("admin"), workspaceController.invinte);

export default router;