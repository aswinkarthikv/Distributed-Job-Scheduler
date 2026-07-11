import React, { useEffect, useState } from 'react';
import { useJobStore } from '../store/JobStore';
import { useWorkerStore } from '../store/WorkerStore';
import ChartCard from '../components/ui/ChartCard';
import StatCard from '../components/ui/StatCard';
import Button from '../components/ui/Button';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { Server, Activity, ShieldAlert, Cpu, Heart, CheckCircle2, Play, RefreshCw, Layers } from 'lucide-react';

export const Analytics: React.FC = () => {
  const { jobs, fetchJobs } = useJobStore();
  const { workers, fetchWorkers } = useWorkerStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchJobs(), fetchWorkers()]).then(() => {
      setLoading(false);
    });
  }, [fetchJobs, fetchWorkers]);

  // Dynamic Telemetry Metrics
  const totalWorkers = workers.length;
  const onlineWorkers = workers.filter(w => w.status === 'online' || w.status === 'busy').length;
  const offlineWorkers = workers.filter(w => w.status === 'offline').length;

  const totalJobsCount = jobs.length;
  const queuedCount = jobs.filter(j => j.status === 'queued').length;
  const runningCount = jobs.filter(j => j.status === 'running').length;
  const failedCount = jobs.filter(j => j.status === 'failed' && j.attempts >= j.maxAttempts).length;
  const retryingCount = jobs.filter(j => j.status === 'scheduled' && j.attempts > 0).length;
  const dlqCount = jobs.filter(j => j.status === 'dead_letter').length;
  const completedCount = jobs.filter(j => j.status === 'completed').length;

  // Rates
  const successRate = totalJobsCount > 0
    ? ((completedCount / totalJobsCount) * 100).toFixed(1)
    : '100.0';
  const failureRate = totalJobsCount > 0
    ? (((failedCount + dlqCount) / totalJobsCount) * 100).toFixed(1)
    : '0.0';

  // Mock Graph Data
  const workerUtilization = [
    { time: '12:00', load: 45 },
    { time: '13:00', load: 55 },
    { time: '14:00', load: 70 },
    { time: '15:00', load: 40 },
    { time: '16:00', load: 60 }
  ];

  const queueActivity = [
    { name: 'Active Queue', processed: completedCount, failed: failedCount + dlqCount }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">System Health Telemetry</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time status reports on node clusters, task execution performance, and recovery statistics.
          </p>
        </div>
        <Button variant="secondary" onClick={() => {
          setLoading(true);
          Promise.all([fetchJobs(), fetchWorkers()]).then(() => setLoading(false));
        }} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh Stats
        </Button>
      </div>

      {/* Cluster Node Status Group */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Online Workers"
          value={onlineWorkers}
          description="Active polling engines"
          icon={<Heart className="w-5 h-5 text-green-500 fill-green-500/10" />}
          isLoading={loading}
        />
        <StatCard
          title="Offline Workers"
          value={offlineWorkers}
          description="Registered stopped nodes"
          icon={<Server className="w-5 h-5 text-red-500" />}
          isLoading={loading}
        />
        <StatCard
          title="Success Rate"
          value={`${successRate}%`}
          description="Successful job completions"
          icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
          isLoading={loading}
        />
        <StatCard
          title="Failure Rate"
          value={`${failureRate}%`}
          description="Permanent job failures"
          icon={<ShieldAlert className="w-5 h-5 text-red-500" />}
          isLoading={loading}
        />
      </div>

      {/* Database State Counts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-card border border-border p-4 rounded-xl text-center">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Queued</span>
          <p className="text-2xl font-bold mt-1 text-blue-500">{queuedCount}</p>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl text-center">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Running</span>
          <p className="text-2xl font-bold mt-1 text-amber-500 animate-pulse">{runningCount}</p>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl text-center">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Retrying</span>
          <p className="text-2xl font-bold mt-1 text-purple-500">{retryingCount}</p>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl text-center">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Failed</span>
          <p className="text-2xl font-bold mt-1 text-red-500">{failedCount}</p>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl text-center">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Dead Letter</span>
          <p className="text-2xl font-bold mt-1 text-rose-600">{dlqCount}</p>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Worker Utilizations */}
        <ChartCard title="Average Processing Load" description="Combined core utilization rate" isLoading={loading}>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={workerUtilization} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }} />
              <Line type="monotone" dataKey="load" stroke="#3b82f6" strokeWidth={2} name="Load %" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Queue Load Profile */}
        <ChartCard title="Completed vs Stalled Jobs" description="Active transaction log distributions" isLoading={loading}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={queueActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="processed" fill="#10b981" name="Completed" radius={[4, 4, 0, 0]} />
              <Bar dataKey="failed" fill="#ef4444" name="Permanent Fail" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};
export default Analytics;
