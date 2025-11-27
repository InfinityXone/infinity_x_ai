import { GoogleWorkspaceManager } from '../integrations/google/workspace-manager.ts';
import { SmartAIRouter } from '../ai/smart-ai-router.ts';
import dotenv from 'dotenv';

dotenv.config();

export interface ScheduledTask {
  id: string;
  title: string;
  description: string;
  scheduledFor: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'event' | 'task' | 'reminder';
  status: 'pending' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  recurrence?: 'daily' | 'weekly' | 'monthly';
  dependencies?: string[]; // IDs of tasks that must complete first
  automationAction?: string; // AI-driven action to perform
}

export interface SchedulingContext {
  existingEvents: any[];
  existingTasks: any[];
  availableTimeSlots: Date[];
  priorities: ScheduledTask[];
}

export class AutonomousScheduler {
  private workspace: GoogleWorkspaceManager;
  private aiRouter: SmartAIRouter;
  private tasks: Map<string, ScheduledTask>;
  private isRunning: boolean;

  constructor(googleAccessToken: string) {
    this.workspace = new GoogleWorkspaceManager(googleAccessToken);
    this.aiRouter = new SmartAIRouter();
    this.tasks = new Map();
    this.isRunning = false;
  }

  // ============================================================
  // AUTONOMOUS SCHEDULING ENGINE
  // ============================================================

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Autonomous scheduler is already running');
      return;
    }

    this.isRunning = true;
    console.log('🤖 Starting Autonomous Scheduling System...');
    console.log('📅 Connected to Google Calendar');
    console.log('✅ Connected to Google Tasks');
    console.log('');

    // Run scheduling loop every 15 minutes
    await this.scheduleLoop();
    setInterval(() => this.scheduleLoop(), 15 * 60 * 1000);
  }

  stop(): void {
    this.isRunning = false;
    console.log('🛑 Autonomous scheduler stopped');
  }

  private async scheduleLoop(): Promise<void> {
    if (!this.isRunning) return;

    try {
      console.log(`\n⏰ [${new Date().toISOString()}] Running scheduling analysis...`);

      // Get current context
      const context = await this.getSchedulingContext();

      // Analyze and optimize schedule
      await this.analyzeAndOptimize(context);

      // Process pending tasks
      await this.processPendingTasks();

      // Check for conflicts
      await this.resolveConflicts(context);

      console.log('✅ Scheduling cycle complete\n');
    } catch (error: any) {
      console.error('❌ Scheduling error:', error.message);
    }
  }

  private async getSchedulingContext(): Promise<SchedulingContext> {
    // Fetch existing calendar events
    const existingEvents = await this.workspace.getUpcomingEvents(50);

    // Fetch existing tasks
    const existingTasks = await this.workspace.getTasks();

    // Calculate available time slots
    const availableTimeSlots = this.calculateAvailableSlots(existingEvents);

    // Get prioritized task list
    const priorities = Array.from(this.tasks.values())
      .filter(task => task.status !== 'completed' && task.status !== 'cancelled')
      .sort((a, b) => this.priorityWeight(b.priority) - this.priorityWeight(a.priority));

    return {
      existingEvents,
      existingTasks,
      availableTimeSlots,
      priorities
    };
  }

  private calculateAvailableSlots(existingEvents: any[]): Date[] {
    const slots: Date[] = [];
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7); // Look ahead 7 days

    // Simple algorithm: find 1-hour slots between 9 AM and 5 PM
    let currentDate = new Date(now);
    currentDate.setHours(9, 0, 0, 0);

    while (currentDate < endDate) {
      const slotStart = new Date(currentDate);
      const slotEnd = new Date(currentDate);
      slotEnd.setHours(slotEnd.getHours() + 1);

      // Check if this slot conflicts with existing events
      const hasConflict = existingEvents.some(event => {
        const eventStart = new Date(event.start.dateTime || event.start.date);
        const eventEnd = new Date(event.end.dateTime || event.end.date);
        return slotStart < eventEnd && slotEnd > eventStart;
      });

      if (!hasConflict && currentDate.getHours() >= 9 && currentDate.getHours() < 17) {
        slots.push(new Date(slotStart));
      }

      // Move to next hour
      currentDate.setHours(currentDate.getHours() + 1);

      // Skip to next day after 5 PM
      if (currentDate.getHours() >= 17) {
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(9, 0, 0, 0);
      }
    }

    return slots;
  }

  private async analyzeAndOptimize(context: SchedulingContext): Promise<void> {
    if (context.priorities.length === 0) {
      console.log('📋 No pending tasks to schedule');
      return;
    }

    console.log(`📊 Analyzing ${context.priorities.length} tasks with ${context.availableTimeSlots.length} available slots`);

    // Use AI to analyze optimal scheduling
    const analysisPrompt = `As a scheduling AI, analyze this schedule and recommend optimizations:

Current Tasks:
${context.priorities.slice(0, 10).map(t => `- ${t.title} (${t.priority})`).join('\n')}

Available Slots: ${context.availableTimeSlots.length} time slots
Existing Events: ${context.existingEvents.length} calendar events
Existing Tasks: ${context.existingTasks.length} task items

Recommend:
1. Which tasks should be scheduled first
2. Optimal time slots for each task
3. Any tasks that should be merged or split
4. Potential conflicts or issues`;

    try {
      const aiResponse = await this.aiRouter.think(analysisPrompt, 'medium');
      console.log('🤖 AI Schedule Analysis:');
      console.log(aiResponse.text.substring(0, 300) + '...');
    } catch (error: any) {
      console.log('⚠️ AI analysis unavailable, using rule-based scheduling');
    }

    // Schedule high-priority tasks to available slots
    await this.autoScheduleTasks(context);
  }

  private async autoScheduleTasks(context: SchedulingContext): Promise<void> {
    let scheduledCount = 0;

    for (const task of context.priorities) {
      if (task.status !== 'pending') continue;
      if (scheduledCount >= 5) break; // Limit to 5 tasks per cycle

      const availableSlot = context.availableTimeSlots[scheduledCount];
      if (!availableSlot) break;

      try {
        if (task.type === 'event') {
          // Schedule as calendar event
          const endTime = new Date(availableSlot);
          endTime.setHours(endTime.getHours() + 1);

          await this.workspace.createEvent({
            summary: task.title,
            description: task.description,
            start: availableSlot,
            end: endTime
          });

          task.status = 'scheduled';
          task.scheduledFor = availableSlot;
          scheduledCount++;

          console.log(`📅 Scheduled event: ${task.title} at ${availableSlot.toLocaleString()}`);
        } else {
          // Create as Google Task
          await this.workspace.createTask({
            title: task.title,
            notes: task.description,
            due: availableSlot
          });

          task.status = 'scheduled';
          task.scheduledFor = availableSlot;
          scheduledCount++;

          console.log(`✅ Scheduled task: ${task.title} for ${availableSlot.toLocaleString()}`);
        }
      } catch (error: any) {
        console.error(`❌ Failed to schedule ${task.title}:`, error.message);
      }
    }

    if (scheduledCount > 0) {
      console.log(`✨ Auto-scheduled ${scheduledCount} tasks`);
    }
  }

  private async processPendingTasks(): Promise<void> {
    const now = new Date();

    for (const [id, task] of this.tasks) {
      if (task.status === 'scheduled' && task.scheduledFor <= now) {
        console.log(`🚀 Executing scheduled task: ${task.title}`);

        task.status = 'in-progress';

        // Execute automation action if specified
        if (task.automationAction) {
          await this.executeAutomation(task);
        }

        // Check if task is complete
        if (await this.checkTaskCompletion(task)) {
          task.status = 'completed';
          console.log(`✅ Task completed: ${task.title}`);
        }
      }
    }
  }

  private async executeAutomation(task: ScheduledTask): Promise<void> {
    if (!task.automationAction) return;

    console.log(`🤖 Executing automation: ${task.automationAction}`);

    try {
      // Use AI to interpret and execute the automation
      const automationPrompt = `Execute this automation task: ${task.automationAction}\n\nContext: ${task.description}`;
      const response = await this.aiRouter.think(automationPrompt, 'medium');

      console.log(`✅ Automation result: ${response.text.substring(0, 150)}...`);
    } catch (error: any) {
      console.error(`❌ Automation failed: ${error.message}`);
    }
  }

  private async checkTaskCompletion(task: ScheduledTask): Promise<boolean> {
    // Check dependencies
    if (task.dependencies && task.dependencies.length > 0) {
      const allDependenciesComplete = task.dependencies.every(depId => {
        const depTask = this.tasks.get(depId);
        return depTask?.status === 'completed';
      });

      if (!allDependenciesComplete) {
        return false;
      }
    }

    // For now, simple time-based completion
    // In production, this would check actual task status from Google Tasks
    return false;
  }

  private async resolveConflicts(context: SchedulingContext): Promise<void> {
    // Check for scheduling conflicts
    const conflicts: string[] = [];

    for (const task of context.priorities) {
      if (task.status === 'scheduled' && task.scheduledFor) {
        const conflictingEvents = context.existingEvents.filter(event => {
          const eventStart = new Date(event.start.dateTime || event.start.date);
          const eventEnd = new Date(event.end.dateTime || event.end.date);
          return task.scheduledFor >= eventStart && task.scheduledFor < eventEnd;
        });

        if (conflictingEvents.length > 0) {
          conflicts.push(`${task.title} conflicts with ${conflictingEvents[0].summary}`);
        }
      }
    }

    if (conflicts.length > 0) {
      console.log('⚠️ Scheduling conflicts detected:');
      conflicts.forEach(c => console.log(`   - ${c}`));

      // Use AI to suggest resolutions
      const conflictPrompt = `Resolve these scheduling conflicts:\n${conflicts.join('\n')}`;
      try {
        const resolution = await this.aiRouter.think(conflictPrompt, 'light');
        console.log('🤖 Suggested resolution:', resolution.text.substring(0, 200));
      } catch (error) {
        console.log('⚠️ Manual conflict resolution required');
      }
    }
  }

  private priorityWeight(priority: string): number {
    switch (priority) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  // ============================================================
  // TASK MANAGEMENT API
  // ============================================================

  async addTask(task: Omit<ScheduledTask, 'id' | 'status'>): Promise<string> {
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullTask: ScheduledTask = {
      ...task,
      id,
      status: 'pending'
    };

    this.tasks.set(id, fullTask);
    console.log(`➕ Added task: ${task.title} (ID: ${id})`);

    return id;
  }

  async updateTask(id: string, updates: Partial<ScheduledTask>): Promise<void> {
    const task = this.tasks.get(id);
    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }

    Object.assign(task, updates);
    console.log(`📝 Updated task: ${task.title}`);
  }

  async deleteTask(id: string): Promise<void> {
    const task = this.tasks.get(id);
    if (task) {
      this.tasks.delete(id);
      console.log(`🗑️ Deleted task: ${task.title}`);
    }
  }

  getTask(id: string): ScheduledTask | undefined {
    return this.tasks.get(id);
  }

  getAllTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }

  getTasksByStatus(status: ScheduledTask['status']): ScheduledTask[] {
    return this.getAllTasks().filter(task => task.status === status);
  }

  // ============================================================
  // QUICK SCHEDULING HELPERS
  // ============================================================

  async scheduleNow(title: string, description: string, automationAction?: string): Promise<string> {
    return this.addTask({
      title,
      description,
      scheduledFor: new Date(),
      priority: 'high',
      type: 'task',
      automationAction
    });
  }

  async scheduleDaily(title: string, description: string, time: string): Promise<string> {
    const [hours, minutes] = time.split(':').map(Number);
    const scheduledFor = new Date();
    scheduledFor.setHours(hours, minutes, 0, 0);

    if (scheduledFor < new Date()) {
      scheduledFor.setDate(scheduledFor.getDate() + 1);
    }

    return this.addTask({
      title,
      description,
      scheduledFor,
      priority: 'medium',
      type: 'task',
      recurrence: 'daily'
    });
  }

  async createMeeting(
    title: string,
    attendees: string[],
    startTime: Date,
    durationHours: number = 1
  ): Promise<string> {
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + durationHours);

    await this.workspace.createEvent({
      summary: title,
      start: startTime,
      end: endTime,
      attendees
    });

    return this.addTask({
      title,
      description: `Meeting with ${attendees.join(', ')}`,
      scheduledFor: startTime,
      priority: 'high',
      type: 'event'
    });
  }
}
