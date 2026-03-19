import { Router } from "express";
import { TaskController } from "./task.controller.js";

const taskController = new TaskController();
const router = Router();

router.post("", taskController.create);

router.post("", taskController.assign);

router.get("", taskController.get);

router.get("", taskController.listByColumn);

router.patch("", taskController.update);

router.patch("", taskController.bulkUpdateStatus);

router.patch("", taskController.reOrder);

router.patch("", taskController.archivTask);

router.patch("", taskController.restoreTask);

router.delete("", taskController.remove);

router.delete("", taskController.bulkRemove);
