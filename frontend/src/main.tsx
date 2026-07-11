import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import App from './App';
import './index.css';

// ==========================================
// In-Memory Mock Database for GitHub Pages
// ==========================================
const db_projects = [
  { id: 'proj-1', name: 'Billing Sync', description: 'Stripe sync & invoice generators', createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), _count: { queues: 3 } },
  { id: 'proj-2', name: 'ETL Pipeline', description: 'Data warehouse batch synchronization', createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), _count: { queues: 2 } },
  { id: 'proj-3', name: 'Log Ingestor', description: 'Application log parser', createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), _count: { queues: 2 } }
];

const db_queues = [
  { id: 'q-1', name: 'high-priority-billing', concurrency: 10, priority: 'critical', paused: false, projectId: 'proj-1' },
  { id: 'q-2', name: 'invoice-pdf-generation', concurrency: 4, priority: 'high', paused: false, projectId: 'proj-1' },
  { id: 'q-9', name: 'notification-email-blasts', concurrency: 15, priority: 'normal', paused: false, projectId: 'proj-1' },
  { id: 'q-3', name: 'database-sync-etl', concurrency: 2, priority: 'normal', paused: false, projectId: 'proj-2' },
  { id: 'q-4', name: 'analytics-aggregator', concurrency: 5, priority: 'normal', paused: false, projectId: 'proj-2' },
  { id: 'q-5', name: 'syslog-streams', concurrency: 20, priority: 'low', paused: false, projectId: 'proj-3' },
  { id: 'q-6', name: 'error-alerts-hook', concurrency: 5, priority: 'high', paused: false, projectId: 'proj-3' }
];

const db_workers = [
  { id: 'w-1', name: 'eu-west-worker-node-1', status: 'online', cpuUsage: 12.5, memoryUsage: 45.2, lastHeartbeat: new Date().toISOString() },
  { id: 'w-2', name: 'eu-west-worker-node-2', status: 'busy', cpuUsage: 85.3, memoryUsage: 78.1, lastHeartbeat: new Date().toISOString() },
  { id: 'w-3', name: 'us-east-worker-node-1', status: 'online', cpuUsage: 8.1, memoryUsage: 35.4, lastHeartbeat: new Date().toISOString() },
  { id: 'w-4', name: 'us-east-worker-node-2', status: 'busy', cpuUsage: 92.4, memoryUsage: 94.8, lastHeartbeat: new Date().toISOString() },
  { id: 'w-5', name: 'ap-south-worker-node-1', status: 'offline', cpuUsage: 0.0, memoryUsage: 0.0, lastHeartbeat: new Date().toISOString() }
];

const db_jobs: any[] = [];
// Generate realistic mock jobs matching seeded database types
for (let i = 1; i <= 60; i++) {
  const queue = db_queues[i % db_queues.length];
  const statuses = ['completed', 'completed', 'completed', 'completed', 'queued', 'running', 'scheduled', 'dead_letter', 'cancelled'];
  const status = statuses[i % statuses.length];
  
  db_jobs.push({
    id: `job-${i}`,
    name: i % 2 === 0 ? `Billing Transaction Task #${1000 + i}` : `Invoice PDF Renderer #${2000 + i}`,
    type: status === 'scheduled' ? 'scheduled' : 'immediate',
    status,
    payload: JSON.stringify({ amount: i * 10, customerId: `cust_${100 + i}`, shouldFail: status === 'dead_letter' }),
    result: status === 'completed' ? JSON.stringify({ success: true, processedTimeMs: 120 + Math.floor(Math.random() * 200) }) : null,
    error: status === 'dead_letter' ? 'DatabaseConnectionError: Timed out waiting for connection pool lease.' : null,
    attempts: status === 'completed' ? 1 : (status === 'dead_letter' ? 3 : 0),
    maxAttempts: 3,
    priority: i % 3,
    delay: 0,
    queueId: queue.id,
    projectId: queue.projectId,
    workerId: status === 'running' ? 'w-1' : null,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    startedAt: status === 'completed' || status === 'running' ? new Date(Date.now() - 3600000 * 3).toISOString() : null,
    completedAt: status === 'completed' ? new Date(Date.now() - 3600000 * 3 + 1200).toISOString() : null,
    failedAt: status === 'dead_letter' ? new Date(Date.now() - 3600000 * 2).toISOString() : null,
    logs: [
      { message: 'Received task payload.', level: 'info', timestamp: new Date().toISOString() },
      status === 'completed' ? { message: 'Execution complete. Changes committed successfully.', level: 'info', timestamp: new Date().toISOString() } : null,
      status === 'dead_letter' ? { message: 'DatabaseConnectionError: Connection timeout.', level: 'error', timestamp: new Date().toISOString() } : null
    ].filter(Boolean)
  });
}

// Global fetch override interceptor
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  let url = typeof input === 'string' ? input : input.toString();
  const apiUrl = ((import.meta as any).env.VITE_API_URL as string) || '';

  // Intercept if we are running in the GitHub Pages environment
  const isGitHubPages = window.location.hostname.includes('github.io') || window.location.hash.includes('mock');

  if (isGitHubPages && url.startsWith('/api')) {
    const method = init?.method || 'GET';
    const body = init?.body ? JSON.parse(init.body as string) : null;

    // Helper for JSON response
    const jsonResponse = (data: any, status = 200) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
      });
    };

    // 1. Auth endpoints
    if (url.includes('/auth/login') || url.includes('/auth/register')) {
      return jsonResponse({
        token: 'mock-jwt-token-for-development',
        user: {
          id: 'usr-1',
          email: body?.email || 'alice@acme.com',
          name: body?.name || 'Alice Smith',
          organizationId: 'org-1'
        }
      });
    }

    // 2. Project endpoints
    if (url.endsWith('/api/projects')) {
      if (method === 'POST') {
        const newProj = {
          id: `proj-${Date.now()}`,
          name: body.name,
          description: body.description || '',
          createdAt: new Date().toISOString(),
          _count: { queues: 0 }
        };
        db_projects.push(newProj);
        return jsonResponse(newProj, 201);
      }
      return jsonResponse(db_projects);
    }
    if (url.match(/\/api\/projects\/[^/]+$/)) {
      const match = url.match(/\/api\/projects\/([^/]+)$/);
      const id = match ? match[1] : '';
      if (method === 'DELETE') {
        const index = db_projects.findIndex(p => p.id === id);
        if (index !== -1) db_projects.splice(index, 1);
        return jsonResponse({ success: true });
      }
    }

    // 3. Queue endpoints
    if (url.includes('/api/queues')) {
      const urlObj = new URL(url, window.location.origin);
      const projectId = urlObj.searchParams.get('projectId');
      
      if (method === 'POST') {
        const newQueue = {
          id: `q-${Date.now()}`,
          name: body.name,
          concurrency: body.concurrency || 5,
          priority: body.priority || 'normal',
          paused: body.paused || false,
          projectId: body.projectId
        };
        db_queues.push(newQueue);
        // increment project queue count
        const proj = db_projects.find(p => p.id === body.projectId);
        if (proj) proj._count.queues += 1;
        return jsonResponse(newQueue, 201);
      }

      const match = url.match(/\/api\/queues\/([^?]+)/);
      const id = match ? match[1] : '';
      if (id) {
        const queueIndex = db_queues.findIndex(q => q.id === id);
        if (method === 'DELETE') {
          if (queueIndex !== -1) {
            const q = db_queues[queueIndex];
            const proj = db_projects.find(p => p.id === q.projectId);
            if (proj) proj._count.queues = Math.max(0, proj._count.queues - 1);
            db_queues.splice(queueIndex, 1);
          }
          return jsonResponse({ success: true });
        }
        if (method === 'PUT') {
          if (queueIndex !== -1) {
            db_queues[queueIndex] = { ...db_queues[queueIndex], ...body };
          }
          return jsonResponse(db_queues[queueIndex]);
        }
      }

      return jsonResponse(db_queues.filter(q => q.projectId === projectId));
    }

    // 4. Job endpoints
    if (url.includes('/api/jobs')) {
      const urlObj = new URL(url, window.location.origin);
      const projectId = urlObj.searchParams.get('projectId');
      const queueId = urlObj.searchParams.get('queueId');
      const statusFilter = urlObj.searchParams.get('status');

      // Create job
      if (method === 'POST') {
        const newJob = {
          id: `job-${Date.now()}`,
          name: body.name,
          type: body.type || 'immediate',
          status: 'queued',
          payload: JSON.stringify(body.payload || {}),
          result: null,
          error: null,
          attempts: 0,
          maxAttempts: body.maxAttempts || 3,
          priority: body.priority || 0,
          delay: body.delay || 0,
          queueId: body.queueId,
          projectId: body.projectId,
          createdAt: new Date().toISOString(),
          logs: [{ message: 'Job queued.', level: 'info', timestamp: new Date().toISOString() }]
        };
        db_jobs.unshift(newJob);
        return jsonResponse(newJob, 201);
      }

      // Retry/Cancel/Delete Job by ID
      const retryMatch = url.match(/\/api\/jobs\/([^/]+)\/retry/);
      if (retryMatch) {
        const id = retryMatch[1];
        const job = db_jobs.find(j => j.id === id);
        if (job) {
          job.status = 'queued';
          job.attempts = 0;
          job.error = null;
          job.logs.push({ message: 'Retry triggered from DLQ.', level: 'info', timestamp: new Date().toISOString() });
        }
        return jsonResponse(job);
      }

      const cancelMatch = url.match(/\/api\/jobs\/([^/]+)\/cancel/);
      if (cancelMatch) {
        const id = cancelMatch[1];
        const job = db_jobs.find(j => j.id === id);
        if (job) {
          job.status = 'cancelled';
          job.logs.push({ message: 'Job cancelled.', level: 'warn', timestamp: new Date().toISOString() });
        }
        return jsonResponse(job);
      }

      const deleteMatch = url.match(/\/api\/jobs\/([^?]+)/);
      if (deleteMatch && method === 'DELETE') {
        const id = deleteMatch[1];
        const index = db_jobs.findIndex(j => j.id === id);
        if (index !== -1) db_jobs.splice(index, 1);
        return jsonResponse({ success: true });
      }

      // Filtered list
      let filtered = db_jobs;
      if (projectId) filtered = filtered.filter(j => j.projectId === projectId);
      if (queueId) filtered = filtered.filter(j => j.queueId === queueId);
      if (statusFilter && statusFilter !== 'all') filtered = filtered.filter(j => j.status === statusFilter);

      return jsonResponse({
        list: filtered,
        total: filtered.length
      });
    }

    // 5. Worker endpoints
    if (url.includes('/api/workers')) {
      if (method === 'POST') {
        if (url.includes('/start')) {
          const worker = db_workers.find(w => w.id === body.id);
          if (worker) worker.status = 'online';
          return jsonResponse(worker);
        }
        if (url.includes('/stop')) {
          const worker = db_workers.find(w => w.id === body.id);
          if (worker) worker.status = 'offline';
          return jsonResponse(worker);
        }
        const newWorker = {
          id: `w-${Date.now()}`,
          name: body.name,
          status: 'offline',
          cpuUsage: 0.0,
          memoryUsage: 0.0,
          lastHeartbeat: new Date().toISOString()
        };
        db_workers.push(newWorker);
        return jsonResponse(newWorker, 201);
      }

      const match = url.match(/\/api\/workers\/([^/]+)$/);
      if (match && method === 'DELETE') {
        const id = match[1];
        const index = db_workers.findIndex(w => w.id === id);
        if (index !== -1) db_workers.splice(index, 1);
        return jsonResponse({ success: true });
      }

      if (url.includes('/health')) {
        const online = db_workers.filter(w => w.status === 'online' || w.status === 'busy').length;
        return jsonResponse({
          total: db_workers.length,
          online,
          offline: db_workers.length - online
        });
      }

      return jsonResponse(db_workers);
    }

    // 6. Metrics endpoints
    if (url.includes('/api/metrics')) {
      const jobsProcessed = db_jobs.filter(j => j.status === 'completed').length;
      const runningJobs = db_jobs.filter(j => j.status === 'running').length;
      const queuedJobs = db_jobs.filter(j => j.status === 'queued').length;
      const failedJobs = db_jobs.filter(j => j.status === 'failed' || j.status === 'dead_letter').length;
      const workersOnline = db_workers.filter(w => w.status === 'online' || w.status === 'busy').length;

      return jsonResponse({
        jobsProcessed,
        runningJobs,
        queuedJobs,
        failedJobs,
        workersOnline,
        cpuAverage: 38.5,
        memoryAverage: 54.2,
        throughputTimeline: [
          { timestamp: '10:00', count: 120 },
          { timestamp: '11:00', count: 185 },
          { timestamp: '12:00', count: 240 },
          { timestamp: '13:00', count: 190 },
          { timestamp: '14:00', count: 310 },
          { timestamp: '15:00', count: 420 },
          { timestamp: '16:00', count: 380 },
          { timestamp: '17:00', count: 450 }
        ],
        queueMetrics: [
          { queueId: 'q-1', queueName: 'high-priority-billing', size: queuedJobs },
          { queueId: 'q-3', queueName: 'database-sync-etl', size: 5 },
          { queueId: 'q-dlq', queueName: 'Dead Letter Queue', size: failedJobs }
        ]
      });
    }
  }

  // Regular production/dev fetch mode
  if (apiUrl && url.startsWith('/api')) {
    const base = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    url = `${base}${url}`;
    return originalFetch(url, init);
  }
  return originalFetch(input, init);
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
