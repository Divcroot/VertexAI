import type { NextFunction, Request, Response } from "express";
import { AppError } from "../error/AppError.js";
import {
  createProject as createProjectService,
  getProjects as getProjectsService,
  getSingleProject as getSingleProjectService,
  getStarredProjects as getStarredProjectsService,
  toggleStar as toggleStarService,
  deleteProject as deleteProjectService,
} from "../services/project.service.js";

// Create a new project for the authenticated user
export const createProject = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId || typeof userId !== "string") {
      throw new AppError("User ID is required", 401);
    }

    const { name, description } = req.body;

    if (!name) {
      throw new AppError("Project name is required", 400);
    }

    const project = await createProjectService({
      owner: userId,
      name,
      description,
    });

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

// Get all projects owned by the authenticated user
export const getProjects = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId || typeof userId !== "string") {
      throw new AppError("User ID is required", 401);
    }

    const projects = await getProjectsService(userId);

    res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

// Get a single project owned by the authenticated user
export const getSingleProject = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId || typeof userId !== "string") {
      throw new AppError("User ID is required", 401);
    }

    const { id } = req.params as { id: string };

    if (!id) {
      throw new AppError("Project ID is required", 400);
    }

    const project = await getSingleProjectService(id, userId);

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

// Get all starred projects owned by the authenticated user
export const getStarredProjects = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId || typeof userId !== "string") {
      throw new AppError("User ID is required", 401);
    }

    const projects = await getStarredProjectsService(userId);

    res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

// Toggle the starred status of a project
export const toggleStar = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId || typeof userId !== "string") {
      throw new AppError("User ID is required", 401);
    }

    const { id } = req.params as { id: string };

    if (!id) {
      throw new AppError("Project ID is required", 400);
    }

    const project = await toggleStarService(id, userId);

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    res.status(200).json({
      success: true,
      message: project.starred
        ? "Project starred successfully"
        : "Project unstarred successfully",
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a project owned by the authenticated user
export const deleteProject = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId || typeof userId !== "string") {
      throw new AppError("User ID is required", 401);
    }

    const { id } = req.params as { id: string };

    if (!id) {
      throw new AppError("Project ID is required", 400);
    }

    const project = await deleteProjectService(id, userId);

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};