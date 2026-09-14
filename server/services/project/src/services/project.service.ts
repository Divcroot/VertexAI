import redis from "../../../../shared/redis/index.js";
import Project from "../models/project.model.js";

interface CreateProjectInput {
  owner: string;
  name: string;
  description?: string;
}

const CACHE_TTL = 5 * 60;

const getProjectsCacheKey = (
  owner: string,
): string => {
  return `projects:${owner}`;
};

const getStarredProjectsCacheKey = (
  owner: string,
): string => {
  return `projects:starred:${owner}`;
};

// =====================================================
// CREATE PROJECT
// =====================================================

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

  await redis.del(
    getProjectsCacheKey(owner),
    getStarredProjectsCacheKey(owner),
  );

  return project;
};

// =====================================================
// GET PROJECTS
// =====================================================

export const getProjects = async (
  owner: string,
) => {
  const cacheKey =
    getProjectsCacheKey(owner);

  const cachedProjects =
    await redis.get(cacheKey);

  if (cachedProjects) {
    try {
      return JSON.parse(cachedProjects);
    } catch {
      await redis.del(cacheKey);
    }
  }

  const projects = await Project.find({
    owner,
  })
    .sort({
      updatedAt: -1,
    })
    .lean();

  await redis.set(
    cacheKey,
    JSON.stringify(projects),
    "EX",
    CACHE_TTL,
  );

  return projects;
};

// =====================================================
// GET SINGLE PROJECT
// =====================================================

export const getSingleProject = async (
  projectId: string,
  owner: string,
) => {
  const project =
    await Project.findOne({
      _id: projectId,
      owner,
    });

  if (!project) {
    return null;
  }

  project.lastOpenedAt = new Date();

  await project.save();

  await redis.del(
    getProjectsCacheKey(owner),
    getStarredProjectsCacheKey(owner),
  );

  return project;
};

// =====================================================
// GET STARRED PROJECTS
// =====================================================

export const getStarredProjects = async (
  owner: string,
) => {
  const cacheKey =
    getStarredProjectsCacheKey(owner);

  const cachedProjects =
    await redis.get(cacheKey);

  if (cachedProjects) {
    try {
      return JSON.parse(cachedProjects);
    } catch {
      await redis.del(cacheKey);
    }
  }

  const projects =
    await Project.find({
      owner,
      starred: true,
    })
      .sort({
        createdAt: -1,
      })
      .lean();

  await redis.set(
    cacheKey,
    JSON.stringify(projects),
    "EX",
    CACHE_TTL,
  );

  return projects;
};

// =====================================================
// TOGGLE STAR
// =====================================================

export const toggleStar = async (
  projectId: string,
  owner: string,
) => {
  const project =
    await Project.findOne({
      _id: projectId,
      owner,
    });

  if (!project) {
    return null;
  }

  project.starred = !project.starred;

  await project.save();

  await redis.del(
    getProjectsCacheKey(owner),
    getStarredProjectsCacheKey(owner),
  );

  return project;
};

// =====================================================
// DELETE PROJECT
// =====================================================

export const deleteProject = async (
  projectId: string,
  owner: string,
) => {
  const project =
    await Project.findOneAndDelete({
      _id: projectId,
      owner,
    });

  if (!project) {
    return null;
  }

  await redis.del(
    getProjectsCacheKey(owner),
    getStarredProjectsCacheKey(owner),
  );

  return project;
};