import { create } from 'zustand';

export interface Worker {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'busy';
  activeJobs: string[];
  cpuUtilization: number;
  memoryUtilization: number;
  lastHeartbeat: string;
}

interface WorkerState {
  workers: Worker[];
  isLoading: boolean;
  fetchWorkers: () => Promise<void>;
  registerWorker: (name: string) => Promise<void>;
  startWorker: (id: string) => Promise<void>;
  stopWorker: (id: string) => Promise<void>;
  deleteWorker: (id: string) => Promise<void>;
}

export const useWorkerStore = create<WorkerState>((set) => ({
  workers: [],
  isLoading: false,
  fetchWorkers: async () => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('djs_token');
      const res = await fetch('/api/workers', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const list = await res.json();
        const mapped: Worker[] = list.map((w: any) => ({
          id: w.id,
          name: w.name,
          status: w.status,
          cpuUtilization: w.cpuUsage || 0,
          memoryUtilization: w.memoryUsage || 0,
          lastHeartbeat: w.lastHeartbeat,
          activeJobs: Array.isArray(w.jobs) ? w.jobs.map((j: any) => j.id) : []
        }));
        set({ workers: mapped });
      }
    } catch (err) {
      console.error('Failed to fetch workers:', err);
    } finally {
      set({ isLoading: false });
    }
  },
  registerWorker: async (name) => {
    try {
      const token = localStorage.getItem('djs_token');
      const res = await fetch('/api/workers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        const w = await res.json();
        set((state) => ({
          workers: [
            {
              id: w.id,
              name: w.name,
              status: w.status,
              cpuUtilization: w.cpuUsage || 0,
              memoryUtilization: w.memoryUsage || 0,
              lastHeartbeat: w.lastHeartbeat,
              activeJobs: []
            },
            ...state.workers
          ]
        }));
      }
    } catch (err) {
      console.error('Failed to register worker:', err);
    }
  },
  startWorker: async (id) => {
    try {
      const token = localStorage.getItem('djs_token');
      const res = await fetch('/api/workers/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        const w = await res.json();
        set((state) => ({
          workers: state.workers.map((item) => (item.id === id ? {
            ...item,
            status: w.status,
            lastHeartbeat: w.lastHeartbeat
          } : item))
        }));
      }
    } catch (err) {
      console.error('Failed to start worker:', err);
    }
  },
  stopWorker: async (id) => {
    try {
      const token = localStorage.getItem('djs_token');
      const res = await fetch('/api/workers/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        const w = await res.json();
        set((state) => ({
          workers: state.workers.map((item) => (item.id === id ? {
            ...item,
            status: w.status,
            lastHeartbeat: w.lastHeartbeat,
            cpuUtilization: 0,
            memoryUtilization: 0
          } : item))
        }));
      }
    } catch (err) {
      console.error('Failed to stop worker:', err);
    }
  },
  deleteWorker: async (id) => {
    try {
      const token = localStorage.getItem('djs_token');
      const res = await fetch(`/api/workers/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        set((state) => ({ workers: state.workers.filter((w) => w.id !== id) }));
      }
    } catch (err) {
      console.error('Failed to delete worker:', err);
    }
  }
}));
