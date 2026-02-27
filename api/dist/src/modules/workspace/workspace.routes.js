import { Router } from 'express';
import { workspaceController } from './workspace.controller.js';
const router = Router();
router.post('/create', workspaceController.create);
export default router;
