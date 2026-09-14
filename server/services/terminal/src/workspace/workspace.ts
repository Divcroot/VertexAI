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
    !name ||
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
  if (!projectId) {
    throw new AppError(
      "Project ID is required",
      400,
    );
  }

  return path.join(
    WORKSPACE_ROOT,
    String(projectId),
  );
};