import { Router } from 'express';
import { ProjectController } from './project.controller.js';
import { authMiddleware } from '../../common/middlewares/auth.middleware.js';
import { requireWorkspaceRole } from '../../common/middlewares/requireWorkspaceRole.middleware.js';
import { ProjectService } from './project.service.js';
import { ProjectRepo } from './project.repo.js';
import { prisma } from '../../db/prisma.js';
import { validateBody, validateParams, validateQuery } from '../../common/middlewares/validateRequest.middleware.js';
import { createBodySchema, listProjectsQuerySchema, updateBodySchema } from './project.schemas.js';
import { ActivityService } from '../activity/activity.service.js';
import { ActivityRepo } from '../activity/activity.repo.js';
import { emptyBodySchema, paginationQuerySchema, workspaceParamsSchema } from '../../common/schemas/common.schemas.js';

const projectController = new ProjectController(
  new ProjectService(
    prisma,
    new ProjectRepo(prisma),
    new ActivityService(new ActivityRepo()),
  ),
);

const router = Router();

router.post(
  '/:workspaceId',
  authMiddleware,
  requireWorkspaceRole('admin'),
  validateParams(workspaceParamsSchema),
  validateBody(createBodySchema),
  projectController.create,
);

router.get(
  '/:workspaceId',
  authMiddleware,
  requireWorkspaceRole(),
  validateParams(workspaceParamsSchema),
  validateBody(emptyBodySchema),
  validateQuery(listProjectsQuerySchema),
  projectController.listByWorkspace,
);

router.get(
  '/:workspaceId/:projectId',
  authMiddleware,
  requireWorkspaceRole(),
  validateParams(workspaceParamsSchema),
  validateBody(emptyBodySchema),
  projectController.get,
);

router.patch(
  '/:workspaceId/:projectId',
  authMiddleware,
  requireWorkspaceRole('admin'),
  validateParams(workspaceParamsSchema),
  validateBody(updateBodySchema),
  projectController.update,
);

router.delete(
  '/:workspaceId/:projectId',
  authMiddleware,
  requireWorkspaceRole('admin'),
  validateParams(workspaceParamsSchema),
  validateBody(emptyBodySchema),
  projectController.remove,
);

export default router;
