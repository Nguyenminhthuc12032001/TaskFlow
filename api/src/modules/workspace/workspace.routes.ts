import { Router } from 'express';
import { workSpaceController } from './workspace.controller.js';
import { authMiddleware } from '../../common/middlewares/auth.middleware.js';

const router = Router();

router.post('/create', authMiddleware, workSpaceController.create);
router.get("/list", authMiddleware, workSpaceController.list);
router.get("/:id", authMiddleware, workSpaceController.getById);
router.put("/:id", authMiddleware, workSpaceController.update);
router.delete("/:id", authMiddleware, workSpaceController.remove);

export default router;