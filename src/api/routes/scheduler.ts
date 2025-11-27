import express from 'express';
import { AutonomousScheduler, ScheduledTask } from '../../automation/autonomous-scheduler.ts';
import { GoogleAppsScriptGenerator } from '../../automation/apps-script-generator.ts';
import { authenticateToken } from './auth.ts';

const router = express.Router();

// Store schedulers per user (in production, use proper session management)
const schedulers = new Map<string, AutonomousScheduler>();

// ============================================================
// SCHEDULER CONTROL
// ============================================================

router.post('/start', authenticateToken, async (req, res) => {
  try {
    const { accessToken } = req.body;
    const userId = (req as any).userId;

    let scheduler = schedulers.get(userId);
    if (!scheduler) {
      scheduler = new AutonomousScheduler(accessToken);
      schedulers.set(userId, scheduler);
    }

    await scheduler.start();

    res.json({
      success: true,
      message: 'Autonomous scheduler started'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/stop', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).userId;
    const scheduler = schedulers.get(userId);

    if (!scheduler) {
      return res.status(404).json({ error: 'No active scheduler found' });
    }

    scheduler.stop();

    res.json({
      success: true,
      message: 'Autonomous scheduler stopped'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// TASK MANAGEMENT
// ============================================================

router.post('/task', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const scheduler = schedulers.get(userId);

    if (!scheduler) {
      return res.status(404).json({ error: 'Scheduler not initialized. Call /start first' });
    }

    const { title, description, scheduledFor, priority, type, automationAction, recurrence, dependencies } = req.body;

    const taskId = await scheduler.addTask({
      title,
      description,
      scheduledFor: new Date(scheduledFor),
      priority: priority || 'medium',
      type: type || 'task',
      automationAction,
      recurrence,
      dependencies
    });

    res.json({
      success: true,
      taskId,
      message: `Task created: ${title}`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/tasks', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).userId;
    const scheduler = schedulers.get(userId);

    if (!scheduler) {
      return res.status(404).json({ error: 'Scheduler not initialized' });
    }

    const { status } = req.query;
    const tasks = status
      ? scheduler.getTasksByStatus(status as ScheduledTask['status'])
      : scheduler.getAllTasks();

    res.json({ tasks });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/task/:taskId', authenticateToken, (req, res) => {
  try {
    const userId = (req as any).userId;
    const scheduler = schedulers.get(userId);

    if (!scheduler) {
      return res.status(404).json({ error: 'Scheduler not initialized' });
    }

    const { taskId } = req.params;
    const task = scheduler.getTask(taskId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ task });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/task/:taskId', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const scheduler = schedulers.get(userId);

    if (!scheduler) {
      return res.status(404).json({ error: 'Scheduler not initialized' });
    }

    const { taskId } = req.params;
    const updates = req.body;

    if (updates.scheduledFor) {
      updates.scheduledFor = new Date(updates.scheduledFor);
    }

    await scheduler.updateTask(taskId, updates);

    res.json({
      success: true,
      message: 'Task updated'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/task/:taskId', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const scheduler = schedulers.get(userId);

    if (!scheduler) {
      return res.status(404).json({ error: 'Scheduler not initialized' });
    }

    const { taskId } = req.params;
    await scheduler.deleteTask(taskId);

    res.json({
      success: true,
      message: 'Task deleted'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// QUICK SCHEDULING
// ============================================================

router.post('/quick/now', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const scheduler = schedulers.get(userId);

    if (!scheduler) {
      return res.status(404).json({ error: 'Scheduler not initialized' });
    }

    const { title, description, automationAction } = req.body;
    const taskId = await scheduler.scheduleNow(title, description, automationAction);

    res.json({
      success: true,
      taskId,
      message: 'Task scheduled for immediate execution'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/quick/daily', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const scheduler = schedulers.get(userId);

    if (!scheduler) {
      return res.status(404).json({ error: 'Scheduler not initialized' });
    }

    const { title, description, time } = req.body;
    const taskId = await scheduler.scheduleDaily(title, description, time);

    res.json({
      success: true,
      taskId,
      message: `Task scheduled daily at ${time}`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/quick/meeting', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const scheduler = schedulers.get(userId);

    if (!scheduler) {
      return res.status(404).json({ error: 'Scheduler not initialized' });
    }

    const { title, attendees, startTime, durationHours } = req.body;
    const taskId = await scheduler.createMeeting(
      title,
      attendees,
      new Date(startTime),
      durationHours || 1
    );

    res.json({
      success: true,
      taskId,
      message: 'Meeting scheduled'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// APPS SCRIPT GENERATION
// ============================================================

router.post('/generate-script/drive-sync', authenticateToken, async (req, res) => {
  try {
    const { sourceFolderId, targetFolderId } = req.body;

    const generator = new GoogleAppsScriptGenerator();
    const project = await generator.generateDriveSyncScript(sourceFolderId, targetFolderId);
    const instructions = await generator.generateDeploymentInstructions(project);

    res.json({
      project,
      instructions
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/generate-script/drive-organizer', authenticateToken, async (req, res) => {
  try {
    const generator = new GoogleAppsScriptGenerator();
    const project = await generator.generateDriveOrganizerScript();
    const instructions = await generator.generateDeploymentInstructions(project);

    res.json({
      project,
      instructions
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/generate-script/email-responder', authenticateToken, async (req, res) => {
  try {
    const generator = new GoogleAppsScriptGenerator();
    const project = await generator.generateEmailAutoResponderScript();
    const instructions = await generator.generateDeploymentInstructions(project);

    res.json({
      project,
      instructions
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/generate-script/calendar-summary', authenticateToken, async (req, res) => {
  try {
    const generator = new GoogleAppsScriptGenerator();
    const project = await generator.generateCalendarSummaryScript();
    const instructions = await generator.generateDeploymentInstructions(project);

    res.json({
      project,
      instructions
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/generate-script/data-logger', authenticateToken, async (req, res) => {
  try {
    const { spreadsheetId } = req.body;

    const generator = new GoogleAppsScriptGenerator();
    const project = await generator.generateDataLoggerScript(spreadsheetId);
    const instructions = await generator.generateDeploymentInstructions(project);

    res.json({
      project,
      instructions
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/generate-script/custom', authenticateToken, async (req, res) => {
  try {
    const { description } = req.body;

    const generator = new GoogleAppsScriptGenerator();
    const project = await generator.generateCustomScript(description);
    const instructions = await generator.generateDeploymentInstructions(project);

    res.json({
      project,
      instructions
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
