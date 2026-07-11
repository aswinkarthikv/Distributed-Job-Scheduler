import { create } from 'zustand';

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

interface QueueState {
  queues: Queue[];
  isLoading: boolean;
  fetchQueues: (projectId?: string) => Promise<void>;
  createQueue: (data: Omit<Queue, 'metrics'>) => Promise<void>;
  togglePause: (id: string) => Promise<void>;
  updateQueue: (id: string, updates: Partial<Queue>) => Promise<void>;
}

export const useQueueStore = create<QueueState>((set, get) => ({
  queues: [],
  isLoading: false,
  fetchQueues: async (projectId) => {
    if (!projectId) return;
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('djs_token');
      const res = await fetch(`/api/queues?projectId=${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const list = await res.json();
        const mapped: Queue[] = list.map((q: any) => ({
          id: q.id,
          name: q.name,
          projectId: q.projectId,
          concurrency: q.concurrency,
          priority: q.priority,
          paused: q.paused,
          retryPolicy: q.retryPolicy || { attempts: 3, backoffFactor: 2, delay: 1000 },
          metrics: q.metrics || { queued: 0, running: 0, completed: 0, failed: 0 }
        }));
        set({ queues: mapped });
      }
    } catch (err) {
      console.error('Failed to fetch queues:', err);
    } finally {
      set({ isLoading: false });
    }
  },
  createQueue: async (data) => {
    try {
      const token = localStorage.getItem('djs_token');
      const res = await fetch('/api/queues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const q = await res.json();
        const mapped: Queue = {
          id: q.id,
          name: q.name,
          projectId: q.projectId,
          concurrency: q.concurrency,
          priority: q.priority,
          paused: q.paused,
          retryPolicy: q.retryPolicy || { attempts: 3, backoffFactor: 2, delay: 1000 },
          metrics: { queued: 0, running: 0, completed: 0, failed: 0 }
        };
        set((state) => ({ queues: [...state.queues, mapped] }));
      }
    } catch (err) {
      console.error('Failed to create queue:', err);
    }
  },
  togglePause: async (id) => {
    const queue = get().queues.find((q) => q.id === id);
    if (!queue) return;
    try {
      const token = localStorage.getItem('djs_token');
      const res = await fetch(`/api/queues/${id}?projectId=${queue.projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ paused: !queue.paused })
      });
      if (res.ok) {
        set((state) => ({
          queues: state.queues.map((q) => (q.id === id ? { ...q, paused: !q.paused } : q))
        }));
      }
    } catch (err) {
      console.error('Failed to toggle queue paused state:', err);
    }
  },
  updateQueue: async (id, updates) => {
    const queue = get().queues.find((q) => q.id === id);
    if (!queue) return;
    try {
      const token = localStorage.getItem('djs_token');
      const res = await fetch(`/api/queues/${id}?projectId=${queue.projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        set((state) => ({
          queues: state.queues.map((q) => (q.id === id ? { ...q, ...updates } : q))
        }));
      }
    } catch (err) {
      console.error('Failed to update queue:', err);
    }
  }
}));
