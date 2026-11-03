import { Router } from "express";
import {
  createTask, deleteTask, getStats, getTask, getTasks, updateTask,
} from "../controllers/taskController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect);
router.route("/").get(getTasks).post(createTask);
router.get("/stats", getStats);
router.route("/:id").get(getTask).patch(updateTask).delete(deleteTask);

export default router;
