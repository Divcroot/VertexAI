import { Router } from "express";
import {
  createProject,
  getProjects,
  getStarredProjects,
  getSingleProject,
  toggleStar,
  deleteProject,
} from "../controllers/project.controller.js";

const router = Router();

router.post("/", createProject);
router.get("/", getProjects);
router.get("/starred", getStarredProjects);
router.get("/:id", getSingleProject);
router.patch("/:id", toggleStar);
router.delete("/:id", deleteProject);

export default router;