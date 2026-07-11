import { create } from 'zustand';

export interface Job {
  id: string;
  name: string;
  projectId: string;
  queueId: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'scheduled' | 'retrying' | 'dead_letter' | 'cancelled';
  payload: Record<string, any>;
  result?: Record<string, any>;
  error?: string;
  attempts: number;
  maxAttempts: number;
  priority: number;
  delay: number;
  runAt?: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  logs: string[];
}

interface JobState {
  jobs: Job[];
  totalJobs: number;
  isLoading: boolean;
  fetchJobs: (filters?: {
    projectId?: string;
    queueId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  createJob: (data: Omit<Job, 'id' | 'attempts' | 'status' | 'logs'>) => Promise<void>;
  retryJob: (id: string) => Promise<void>;
  cancelJob: (id: string) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
}

export const useJobStore = create<JobState>((set) => ({
  jobs: [],
  totalJobs: 0,
  isLoading: false,
  fetchJobs: async (filters) => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('djs_token');
      const queryParams = new URLSearchParams();
      if (filters?.projectId) queryParams.append('projectId', filters.projectId);
      if (filters?.queueId) queryParams.append('queueId', filters.queueId);
      if (filters?.status && filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters?.search) queryParams.append('search', filters.search);
      if (filters?.page) queryParams.append('page', String(filters.page));
      if (filters?.limit) queryParams.append('limit', String(filters.limit));

      const res = await fetch(`/api/jobs?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        // Parse payload/result strings to objects
        const parsedList = (data.list || []).map((j: any) => ({
          ...j,
          payload: typeof j.payload === 'string' ? JSON.parse(j.payload) : j.payload,
          result: typeof j.result === 'string' && j.result ? JSON.parse(j.result) : j.result,
          logs: Array.isArray(j.logs) ? j.logs.map((log: any) => log.message || log) : []
        }));
        set({ jobs: parsedList, totalJobs: data.total || 0 });
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      set({ isLoading: false });
    }
  },
  createJob: async (data) => {
    try {
      const token = localStorage.getItem('djs_token');
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const newJob = await res.json();
        set((state) => ({
          jobs: [
            {
              ...newJob,
              payload: typeof newJob.payload === 'string' ? JSON.parse(newJob.payload) : newJob.payload,
              logs: []
            },
            ...state.jobs
          ]
        }));
      }
    } catch (err) {
      console.error('Failed to create job:', err);
    }
  },
  retryJob: async (id) => {
    try {
      const token = localStorage.getItem('djs_token');
      const res = await fetch(`/api/jobs/${id}/retry`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const updated = await res.json();
        set((state) => ({
          jobs: state.jobs.map((j) => (j.id === id ? {
            ...updated,
            payload: typeof updated.payload === 'string' ? JSON.parse(updated.payload) : updated.payload,
            logs: Array.isArray(updated.logs) ? updated.logs.map((l: any) => l.message || l) : []
          } : j))
        }));
      }
    } catch (err) {
      console.error('Failed to retry job:', err);
    }
  },
  cancelJob: async (id) => {
    try {
      const token = localStorage.getItem('djs_token');
      const res = await fetch(`/api/jobs/${id}/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const updated = await res.json();
        set((state) => ({
          jobs: state.jobs.map((j) => (j.id === id ? {
            ...updated,
            payload: typeof updated.payload === 'string' ? JSON.parse(updated.payload) : updated.payload,
            logs: Array.isArray(updated.logs) ? updated.logs.map((l: any) => l.message || l) : []
          } : j))
        }));
      }
    } catch (err) {
      console.error('Failed to cancel job:', err);
    }
  },
  deleteJob: async (id) => {
    try {
      const token = localStorage.getItem('djs_token');
      const res = await fetch(`/api/jobs/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        set((state) => ({ jobs: state.jobs.filter((j) => j.id !== id) }));
      }
    } catch (err) {
      console.error('Failed to delete job:', err);
    }
  }
}));
