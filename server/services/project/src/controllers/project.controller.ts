import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { AppError } from "../error/AppError.js";
import {
  createProject as createProjectService,
  deleteProject as deleteProjectService,
  getProjects as getProjectsService,
  getSingleProject as getSingleProjectService,
  getStarredProjects as getStarredProjectsService,
  toggleStar as toggleStarService,
} from "../services/project.service.js";

const getUserId = (
  req: Request,
): string => {
  const userId = req.headers["x-user-id"];

  if (
    typeof userId !== "string" ||
    !userId.trim()
  ) {
    throw new AppError(
      "User ID is required",
      401,
    );
  }

  return userId;
};

const getProjectId = (
  req: Request,
): string => {
  const { id } = req.params as {
    id?: string;
  };

  if (
    typeof id !== "string" ||
    !id.trim()
  ) {
    throw new AppError(
      "Project ID is required",
      400,
    );
  }

  return id;
};

// =====================================================
// CREATE PROJECT
// =====================================================

export const createProject = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = getUserId(req);

    const {
      name,
      description,
    } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      throw new AppError(
        "Project name is required",
        400,
      );
    }

    const project =
      await createProjectService({
        owner: userId,
        name: name.trim(),
        description:
          typeof description === "string"
            ? description.trim()
            : undefined,
      });

    res.status(201).json({
      success: true,
      message:
        "Project created successfully",
      data: project,
    });
  } catch (error: unknown) {
    next(error);
  }
};

// =====================================================
// GET PROJECTS
// =====================================================

export const getProjects = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = getUserId(req);

    const projects =
      await getProjectsService(userId);

    res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error: unknown) {
    next(error);
  }
};

// =====================================================
// GET SINGLE PROJECT
// =====================================================

export const getSingleProject = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const projectId = getProjectId(req);

    const project =
      await getSingleProjectService(
        projectId,
        userId,
      );

    if (!project) {
      throw new AppError(
        "Project not found",
        404,
      );
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error: unknown) {
    next(error);
  }
};

// =====================================================
// GET STARRED PROJECTS
// =====================================================

export const getStarredProjects = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = getUserId(req);

    const projects =
      await getStarredProjectsService(
        userId,
      );

    res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error: unknown) {
    next(error);
  }
};

// =====================================================
// TOGGLE STAR
// =====================================================

export const toggleStar = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const projectId = getProjectId(req);

    const project =
      await toggleStarService(
        projectId,
        userId,
      );

    if (!project) {
      throw new AppError(
        "Project not found",
        404,
      );
    }

    res.status(200).json({
      success: true,
      message: project.starred
        ? "Project starred successfully"
        : "Project unstarred successfully",
      data: project,
    });
  } catch (error: unknown) {
    next(error);
  }
};

// =====================================================
// DELETE PROJECT
// =====================================================

export const deleteProject = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const projectId = getProjectId(req);

    const project =
      await deleteProjectService(
        projectId,
        userId,
      );

    if (!project) {
      throw new AppError(
        "Project not found",
        404,
      );
    }

    res.status(200).json({
      success: true,
      message:
        "Project deleted successfully",
    });
  } catch (error: unknown) {
    next(error);
  }
};