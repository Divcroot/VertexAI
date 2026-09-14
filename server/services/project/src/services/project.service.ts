import Project from "../models/project.model.js";
import redis from "../../../../shared/redis/index.js";

interface CreateProjectInput {
  owner: string;
  name: string;
  description?: string;
}

// Create a new project for the authenticated user
export const createProject = async ({
  owner,
  name,
  description,
}: CreateProjectInput) => {
  const project = await Project.create({
    owner,
    name,
    description,
  });

  await redis.del(`projects:${owner}`);

  return project;
};

// Get all projects owned by the authenticated user
export const getProjects = async (owner: string) => {
  const cacheKey = `projects:${owner}`;

  const cachedProjects = await redis.get(cacheKey);

  if (cachedProjects) {
    return JSON.parse(cachedProjects);
  }

  const projects = await Project.find({ owner }).sort({
    updatedAt: -1,
  });

  await redis.set(
    cacheKey,
    JSON.stringify(projects),
    "EX",
    5 * 60,
  );

  return projects;
};

// Get a single project and update its last opened time
export const getSingleProject = async (
  projectId: string,
  owner: string,
) => {
  const project = await Project.findOne({
    _id: projectId,
    owner,
  });

  if (!project) {
    return null;
  }

  project.lastOpenedAt = new Date();

  await project.save();

  return project;
};

// Get all starred projects owned by the authenticated user
export const getStarredProjects = async (owner: string) => {
  const cacheKey = `projects:starred:${owner}`;

  const cachedProjects = await redis.get(cacheKey);

  if (cachedProjects) {
    return JSON.parse(cachedProjects);
  }

  const projects = await Project.find({
    owner,
    starred: true,
  }).sort({
    createdAt: -1,
  });

  await redis.set(
    cacheKey,
    JSON.stringify(projects),
    "EX",
    5 * 60,
  );

  return projects;
};

// Toggle the starred status of a project
export const toggleStar = async (
  projectId: string,
  owner: string,
) => {
  const project = await Project.findOne({
    _id: projectId,
    owner,
  });

  if (!project) {
    return null;
  }

  project.starred = !project.starred;

  await project.save();

  await redis.del(
    `projects:${owner}`,
    `projects:starred:${owner}`,
  );

  return project;
};

// Delete a project owned by the authenticated user
export const deleteProject = async (
  projectId: string,
  owner: string,
) => {
  const project = await Project.findOneAndDelete({
    _id: projectId,
    owner,
  });

  if (!project) {
    return null;
  }

  await redis.del(
    `projects:${owner}`,
    `projects:starred:${owner}`,
  );

  return project;
};