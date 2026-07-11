import { create } from 'zustand';

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  queueCount: number;
  activeJobsCount: number;
}

interface ProjectState {
  projects: Project[];
  activeProject: Project | null;
  isLoading: boolean;
  fetchProjects: () => Promise<void>;
  setActiveProject: (project: Project) => void;
  createProject: (name: string, description?: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  activeProject: null,
  isLoading: false,
  fetchProjects: async () => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('djs_token');
      const res = await fetch('/api/projects', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const list = await res.json();
        const mapped: Project[] = list.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          createdAt: p.createdAt,
          queueCount: p._count?.queues || 0,
          activeJobsCount: 0 // Will dynamically load running jobs count
        }));
        set({
          projects: mapped,
          activeProject: get().activeProject
            ? mapped.find((item) => item.id === get().activeProject?.id) || mapped[0] || null
            : mapped[0] || null
        });
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      set({ isLoading: false });
    }
  },
  setActiveProject: (project) => set({ activeProject: project }),
  createProject: async (name, description) => {
    try {
      const token = localStorage.getItem('djs_token');
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, description })
      });
      if (res.ok) {
        const newProj = await res.json();
        const mapped: Project = {
          id: newProj.id,
          name: newProj.name,
          description: newProj.description || '',
          createdAt: newProj.createdAt,
          queueCount: 0,
          activeJobsCount: 0
        };
        set((state) => ({ projects: [...state.projects, mapped] }));
      }
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  },
  deleteProject: async (id) => {
    try {
      const token = localStorage.getItem('djs_token');
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        set((state) => {
          const remaining = state.projects.filter((p) => p.id !== id);
          return {
            projects: remaining,
            activeProject: state.activeProject?.id === id ? remaining[0] || null : state.activeProject
          };
        });
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  }
}));
