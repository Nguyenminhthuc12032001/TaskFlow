import { Router } from 'express';
import { LeadController } from './lead.controller.js';
import { authMiddleware } from '../../common/middlewares/auth.middleware.js';
import { requireWorkspaceRole } from '../../common/middlewares/requireWorkspaceRole.middleware.js';
import { validateBody } from '../../common/middlewares/validateBody.middleware.js';
import {
  createBodySchema,
  createFollowUpTaskBodySchema,
  updateBodySchema,
  updateStageBodySchema,
} from './lead.schemas.js';
import { emptyBodySchema } from '../../common/schemas/common.schemas.js';
import { LeadService } from './lead.service.js';
import { prisma } from '../../db/prisma.js';
import { LeadRepo } from './lead.repo.js';
import { TaskRepo } from '../task/task.repo.js';
import { ActivityService } from '../activity/activity.service.js';
import { ActivityRepo } from '../activity/activity.repo.js';

const leadController = new LeadController(
  new LeadService(
    prisma,
    new LeadRepo(prisma),
    new TaskRepo(prisma),
    new ActivityService(new ActivityRepo()),
  ),
);

const router = Router();

router.post(
  '/:workspaceId',
  authMiddleware,
  requireWorkspaceRole('member'),
  validateBody(createBodySchema),
  leadController.create,
);

router.get(
  '/:workspaceId/:leadId',
  authMiddleware,
  requireWorkspaceRole('member'),
  validateBody(emptyBodySchema),
  leadController.get,
);

router.get(
  '/:workspaceId',
  authMiddleware,
  requireWorkspaceRole('member'),
  validateBody(emptyBodySchema),
  leadController.listByWorkspace,
);

router.patch(
  '/:workspaceId/:leadId',
  authMiddleware,
  requireWorkspaceRole('member'),
  validateBody(updateBodySchema),
  leadController.update,
);

router.patch(
  '/:workspaceId/:leadId/updateStage',
  authMiddleware,
  requireWorkspaceRole('member'),
  validateBody(updateStageBodySchema),
  leadController.updateStage,
);

router.patch(
  '/:workspaceId/:leadId/:taskId/linkTask',
  authMiddleware,
  requireWorkspaceRole('member'),
  validateBody(emptyBodySchema),
  leadController.linkTask,
);

router.patch(
  '/:workspaceId/:leadId/:taskId/unlinkTask',
  authMiddleware,
  requireWorkspaceRole('member'),
  validateBody(emptyBodySchema),
  leadController.unlinkTask,
);

router.post(
  '/:workspaceId/:projectId/:columnId/:leadId',
  authMiddleware,
  requireWorkspaceRole('member'),
  validateBody(createFollowUpTaskBodySchema),
  leadController.createFollowUpTask,
);

router.delete(
  '/:workspaceId/:leadId',
  authMiddleware,
  requireWorkspaceRole('member'),
  validateBody(emptyBodySchema),
  leadController.remove,
);

export default router;
