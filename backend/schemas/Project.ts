interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Project {
  id: number;
  title: string;
  description: string;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Task {
  id: number;
  projectId: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Activity {
  id: number;
  projectId: number;
  taskId: number;
  action: 'created' | 'updated' | 'deleted';
  userId: number;
  createdAt: Date;
}

interface Stat {
  id: number;
  projectId: number;
  metric: 'tasks_completed' | 'tasks_pending' | 'tasks_in_progress';
  value: number;
  createdAt: Date;
}

interface Analytic {
  id: number;
  projectId: number;
  metric: 'project_velocity' | 'task_distribution';
  value: number;
  createdAt: Date;
}

interface Comment {
  id: number;
  projectId: number;
  taskId: number;
  userId: number;
  content: string;
  createdAt: Date;
}