import { Router } from 'express';
import { workSpaceController } from './workspace.controller.js';
import { authMiddleware } from '../../common/middlewares/auth.middleware.js';
import { requireWorkspaceMember } from '../../common/middlewares/requireWorkspaceMember.middleware.js';

const router = Router();

router.post('/create', authMiddleware, workSpaceController.create);
router.get("/list", authMiddleware, requireWorkspaceMember, workSpaceController.list);
router.get("/:id", authMiddleware, requireWorkspaceMember, workSpaceController.getById);
router.put("/:id", authMiddleware, requireWorkspaceMember("admin"), workSpaceController.update);
router.delete("/:id", authMiddleware, requireWorkspaceMember("admin"), workSpaceController.remove);
router.post("/:id/invite", authMiddleware, requireWorkspaceMember("admin"), workSpaceController.invinte);

export default router;