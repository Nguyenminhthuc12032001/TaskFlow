import { Router } from 'express';
import { TaskController } from './task.controller.js';
import { TaskService } from './task.service.js';
import { prisma } from '../../db/prisma.js';
import { ActivityService } from '../activity/activity.service.js';
import { TaskRepo } from './task.repo.js';
import { ActivityRepo } from '../activity/activity.repo.js';
import { authMiddleware } from '../../common/middlewares/auth.middleware.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../common/middlewares/validateRequest.middleware.js';
import {
  assignBodySchema,
  bulkRemoveBodySchema,
  createBodySchema,
  listTaskByColumnQuerySchema,
  reOrderBodySchema,
  updateBodySchema,
} from './task.schemas.js';
import {
  emptyBodySchema,
  paginationQuerySchema,
  workspaceParamsSchema,
} from '../../common/schemas/common.schemas.js';
import { requireWorkspaceRole } from '../../common/middlewares/requireWorkspaceRole.middleware.js';

const taskController = new TaskController(
  new TaskService(prisma, new ActivityService(new ActivityRepo()), new TaskRepo(prisma)),
);
const router = Router();

router.post(
  '/:workspaceId/:projectId/:columnId',
  authMiddleware,
  requireWorkspaceRole('admin'),
  validateParams(workspaceParamsSchema),
  validateBody(createBodySchema),
  taskController.create,
);

router.post(
  '/:workspaceId/:projectId/:columnId/:taskId',
  authMiddleware,
  requireWorkspaceRole('admin'),
  validateParams(workspaceParamsSchema),
  validateBody(assignBodySchema),
  taskController.assign,
);

router.get(
  '/:workspaceId/:projectId/:columnId/:taskId',
  authMiddleware,
  requireWorkspaceRole(),
  validateParams(workspaceParamsSchema),
  validateBody(emptyBodySchema),
  taskController.get,
);

router.get(
  '/:workspaceId/:projectId/:columnId',
  authMiddleware,
  requireWorkspaceRole(),
  validateParams(workspaceParamsSchema),
  validateBody(emptyBodySchema),
  validateQuery(listTaskByColumnQuerySchema),
  taskController.listByColumn,
);

router.patch(
  '/:workspaceId/:projectId/:columnId/:taskId',
  authMiddleware,
  requireWorkspaceRole('admin'),
  validateParams(workspaceParamsSchema),
  validateBody(updateBodySchema),
  taskController.update,
);

router.patch(
  '/:workspaceId/:projectId/:columnId',
  authMiddleware,
  requireWorkspaceRole('admin'),
  validateParams(workspaceParamsSchema),
  validateBody(reOrderBodySchema),
  validateQuery(paginationQuerySchema),
  taskController.reOrder,
);

router.patch(
  '/:workspaceId/:projectId/:columnId/:taskId/archiv',
  authMiddleware,
  requireWorkspaceRole('admin'),
  validateParams(workspaceParamsSchema),
  validateBody(emptyBodySchema),
  taskController.archivTask,
);

router.patch(
  '/:workspaceId/:projectId/:columnId/:taskId/restore',
  authMiddleware,
  requireWorkspaceRole('admin'),
  validateBody(emptyBodySchema),
  taskController.restoreTask,
);

router.delete(
  '/:workspaceId/:projectId/:columnId/:taskId',
  authMiddleware,
  requireWorkspaceRole('admin'),
  validateBody(emptyBodySchema),
  taskController.remove,
);

router.delete(
  '/:workspaceId/:projectId/:columnId',
  authMiddleware,
  requireWorkspaceRole('admin'),
  validateParams(workspaceParamsSchema),
  validateBody(bulkRemoveBodySchema),
  taskController.bulkRemove,
);

export default router;
