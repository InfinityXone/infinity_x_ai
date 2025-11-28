import express, { Request, Response, NextFunction } from 'express';
import { validate } from 'joi';
import _ from 'lodash';
import { projectSchema } from '../schemas/project.schema';

const projectRouter = express.Router();

// GET /api/projects
projectRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = await getProjects();
    const analytics = await getAnalytics();
    const stats = await getStats();
    const activityFeed = await getActivityFeed();

    res.json({ projects, analytics, stats, activityFeed });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects
projectRouter.post('/', validateProject, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await createProject(req.body);
    res.json(project);
  } catch (error) {
    next(error);
  }
});

function validateProject(req: Request, res: Response, next: NextFunction) {
  const { error } = validate(req.body, projectSchema);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
}

// Mock functions for demonstration purposes
async function getProjects() {
  return [
    { id: 1, name: 'Project 1' },
    { id: 2, name: 'Project 2' },
  ];
}

async function getAnalytics() {
  return {
    totalProjects: 10,
    activeProjects: 5,
  };
}

async function getStats() {
  return {
    completedTasks: 20,
    pendingTasks: 10,
  };
}

async function getActivityFeed() {
  return [
    { id: 1, message: 'Project created' },
    { id: 2, message: 'Task completed' },
  ];
}

async function createProject(project: any) {
  return { id: 3, name: project.name };
}

export default projectRouter;