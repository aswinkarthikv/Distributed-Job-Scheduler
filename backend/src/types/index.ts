export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  queueCount: number;
  activeJobsCount: number;
}

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'scheduled';

export interface Job {
  id: string;
  name: string;
  projectId: string;
  queueId: string;
  status: JobStatus;
  payload: Record<string, any>;
  result?: Record<string, any>;
  error?: string;
  attempts: number;
  maxAttempts: number;
  priority: number; // 0 is default, higher is faster/higher priority
  retryDelay: number; // in milliseconds
  runAt?: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  logs: string[];
}

export interface Queue {
  id: string;
  name: string;
  projectId: string;
  concurrency: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
  paused: boolean;
  retryPolicy: {
    attempts: number;
    backoffFactor: number;
    delay: number;
  };
  metrics: {
    queued: number;
    running: number;
    completed: number;
    failed: number;
  };
}

export interface Worker {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'busy';
  activeJobs: string[];
  cpuUtilization: number;
  memoryUtilization: number;
  lastHeartbeat: string;
}

export interface SystemMetrics {
  jobsProcessed: number;
  runningJobs: number;
  queuedJobs: number;
  failedJobs: number;
  workersOnline: number;
  cpuAverage: number;
  memoryAverage: number;
  throughputTimeline: { timestamp: string; count: number }[];
  queueMetrics: { queueId: string; queueName: string; size: number }[];
}
