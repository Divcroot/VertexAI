import os from "node:os";
import path from "node:path";

import { AppError } from "../error/AppError.js";

export const WORKSPACE_ROOT = path.join(
  os.tmpdir(),
  "vertex-ai",
);

export const safeName = (
  name: string,
): string => {
  if (
    typeof name !== "string" ||
    !name.trim() ||
    name === "." ||
    name === ".." ||
    name.includes("/") ||
    name.includes("\\")
  ) {
    throw new AppError(
      `Invalid file/folder name: ${name}`,
      400,
    );
  }

  return name;
};

export const getWorkspace = (
  projectId: string,
): string => {
  if (
    typeof projectId !== "string" ||
    !projectId.trim()
  ) {
    throw new AppError(
      "Project ID is required",
      400,
    );
  }

  if (
    projectId === "." ||
    projectId === ".." ||
    projectId.includes("/") ||
    projectId.includes("\\")
  ) {
    throw new AppError(
      "Invalid project ID",
      400,
    );
  }

  return path.join(
    WORKSPACE_ROOT,
    projectId,
  );
};