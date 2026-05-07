import { Router } from 'express';
import { LeadController } from './lead.controller.js';
import { authMiddleware } from '../../common/middlewares/auth.middleware.js';
import { requireWorkspaceRole } from '../../common/middlewares/requireWorkspaceRole.middleware.js';
import { validateBody, validateParams, validateQuery } from '../../common/middlewares/validateRequest.middleware.js';
import {
  createBodySchema,
  createFollowUpTaskBodySchema,
  listLeadByActorQuerySchema,
  listLeadsQuerySchema,
  updateBodySchema,
  updateStageBodySchema,
} from './lead.schemas.js';
import { emptyBodySchema, paginationQuerySchema, workspaceParamsSchema } from '../../common/schemas/common.schemas.js';
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
  validateParams(workspaceParamsSchema),
  validateBody(createBodySchema),
  leadController.create,
);

router.get(
  '',
  authMiddleware,
  validateBody(emptyBodySchema),
  validateQuery(listLeadByActorQuerySchema),
  leadController.listByActorWorkspaces,
);

router.get(
  '/:workspaceId/:leadId',
  authMiddleware,
  requireWorkspaceRole('member'),
  validateParams(workspaceParamsSchema),
  validateBody(emptyBodySchema),
  leadController.get,
);

router.get(
  '/:workspaceId',
  authMiddleware,
  requireWorkspaceRole('member'),
  validateParams(workspaceParamsSchema),
  validateBody(emptyBodySchema),
  validateQuery(listLeadsQuerySchema),
  leadController.listByWorkspace,
);

router.patch(
  '/:workspaceId/:leadId',
  authMiddleware,
  requireWorkspaceRole('member'),
  validateParams(workspaceParamsSchema),
  validateBody(updateBodySchema),
  leadController.update,
);

router.patch(
  '/:workspaceId/:leadId/updateStage',
  authMiddleware,
  requireWorkspaceRole('member'),
  validateParams(workspaceParamsSchema),
  validateBody(updateStageBodySchema),
  leadController.updateStage,
);

router.patch(
  '/:workspaceId/:leadId/:taskId/linkTask',
  authMiddleware,
  requireWorkspaceRole('member'),
  validateParams(workspaceParamsSchema),
  validateBody(emptyBodySchema),
  leadController.linkTask,
);

router.delete(
  '/:workspaceId/:leadId/:taskId/unlinkTask',
  authMiddleware,
  requireWorkspaceRole('member'),
  validateParams(workspaceParamsSchema),
  validateBody(emptyBodySchema),
  leadController.unlinkTask,
);

router.post(
  '/:workspaceId/:projectId/:columnId/:leadId',
  authMiddleware,
  requireWorkspaceRole('member'),
  validateParams(workspaceParamsSchema),
  validateBody(createFollowUpTaskBodySchema),
  leadController.createFollowUpTask,
);

router.delete(
  '/:workspaceId/:leadId',
  authMiddleware,
  requireWorkspaceRole('member'),
  validateParams(workspaceParamsSchema),
  validateBody(emptyBodySchema),
  leadController.remove,
);

export default router;
