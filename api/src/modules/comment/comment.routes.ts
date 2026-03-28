import { Router } from 'express';
import { CommentController } from './comment.controller.js';
import { authMiddleware } from '../../common/middlewares/auth.middleware.js';
import { requireWorkspaceRole } from '../../common/middlewares/requireWorkspaceRole.middleware.js';
import { validateBody } from '../../common/middlewares/validateBody.middleware.js';
import { createBodySchema, updateBodySchema } from './comment.schemas.js';
import { emptyBodySchema } from '../../common/schemas/common.schemas.js';
import { CommentService } from './comment.service.js';
import { prisma } from '../../db/prisma.js';
import { ActivityService } from '../activity/activity.service.js';
import { ActivityRepo } from '../activity/activity.repo.js';
import { CommentRepo } from './comment.repo.js';

const commentControlelr = new CommentController(
  new CommentService(prisma, new ActivityService(new ActivityRepo()), new CommentRepo(prisma)),
);

const router = Router();

const defaultRoute = '/:workspaceId/:projectId/:columnId/:taskId';

router.post(
  defaultRoute,
  authMiddleware,
  requireWorkspaceRole('member'),
  validateBody(createBodySchema),
  commentControlelr.create,
);

router.post(
  defaultRoute + '/:commentId',
  authMiddleware,
  requireWorkspaceRole('member'),
  validateBody(createBodySchema),
  commentControlelr.reply,
);

router.get(
  defaultRoute + '/:commentId',
  authMiddleware,
  requireWorkspaceRole(),
  validateBody(emptyBodySchema),
  commentControlelr.get,
);

router.get(
  defaultRoute,
  authMiddleware,
  requireWorkspaceRole(),
  validateBody(emptyBodySchema),
  commentControlelr.listByTask,
);

router.patch(
  defaultRoute + '/:commentId',
  authMiddleware,
  requireWorkspaceRole('member'),
  validateBody(updateBodySchema),
  commentControlelr.update,
);

router.delete(
  defaultRoute + '/:commentId',
  authMiddleware,
  requireWorkspaceRole('member'),
  validateBody(emptyBodySchema),
  commentControlelr.remove,
);

export default router;
