import express, { Request, Response, Router } from 'express';
import { ProjectService } from '../services/project.service';
import { validate } from '../utils/validation';

/**
 * @typedef {object} DashboardStats
 * @property {number} totalProjects
 * @property {number} completedProjects
 * @property {number} pendingProjects
 */

/**
 * @typedef {object} DashboardActivity
 * @property {string} id
 * @property {string} projectName
 * @property {string} activityType
 * @property {Date} createdAt
 */

/**
 * @typedef {object} DashboardResponse
 * @property {DashboardStats} stats
 * @property {DashboardActivity[]} activityFeed
 */

/**
 * @route GET /dashboard
 * @group Dashboard - Project management dashboard
 * @returns {DashboardResponse.model} 200 - Dashboard data
 * @returns {Error.model} 500 - Server error
 */
const projectService = new ProjectService();
const dashboardRouter: Router = express.Router();

/**
 * @function getDashboard
 * @async
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getDashboard = async (req: Request, res: Response) => {
  try {
    // Validate request
    const errors = validate(req);
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Invalid request', errors });
    }

    // Fetch dashboard data
    const stats = await projectService.getDashboardStats();
    const activityFeed = await projectService.getDashboardActivity();

    // Return response
    return res.status(200).json({ stats, activityFeed });
  } catch (error) {
    // Handle server error
    return res.status(500).json({ message: 'Server error', error });
  }
};

// Define route
dashboardRouter.get('/dashboard', getDashboard);

export default dashboardRouter;