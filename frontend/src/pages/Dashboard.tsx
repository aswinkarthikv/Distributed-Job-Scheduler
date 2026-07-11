import React, { useEffect, useState } from 'react';
import { useJobStore } from '../store/JobStore';
import { useWorkerStore } from '../store/WorkerStore';
import { useQueueStore } from '../store/QueueStore';
import StatCard from '../components/ui/StatCard';
import ChartCard from '../components/ui/ChartCard';
import StatusBadge from '../components/ui/StatusBadge';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { CheckCircle2, Play, RefreshCw, Cpu, Server, Clock, AlertTriangle } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { jobs, fetchJobs } = useJobStore();
  const { workers, fetchWorkers } = useWorkerStore();
  const { queues, fetchQueues } = useQueueStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchJobs(), fetchWorkers(), fetchQueues()]).then(() => {
      setIsLoading(false);
    });
  }, [fetchJobs, fetchWorkers, fetchQueues]);

  // Derived metrics
  const completedCount = jobs.filter(j => j.status === 'completed').length;
  const runningCount = jobs.filter(j => j.status === 'running').length;
  const queuedCount = jobs.filter(j => j.status === 'queued').length;
  const failedCount = jobs.filter(j => j.status === 'failed').length;

  const totalWorkers = workers.length;
  const avgCpu = totalWorkers > 0
    ? (workers.reduce((acc, w) => acc + w.cpuUtilization, 0) / totalWorkers).toFixed(1)
    : '0';
  const avgMemory = totalWorkers > 0
    ? (workers.reduce((acc, w) => acc + w.memoryUtilization, 0) / totalWorkers).toFixed(1)
    : '0';

  // Chart data
  const throughputData = [
    { name: '10:00', completed: 42, failed: 2 },
    { name: '11:00', completed: 58, failed: 1 },
    { name: '12:00', completed: 85, failed: 4 },
    { name: '13:00', completed: 73, failed: 0 },
    { name: '14:00', completed: 110, failed: 5 },
    { name: '15:00', completed: 142, failed: 8 },
    { name: '16:00', completed: 130, failed: 3 }
  ];

  const queueDistribution = queues.map((q, idx) => ({
    name: q.name,
    value: q.metrics.completed + q.metrics.queued + q.metrics.running + q.metrics.failed,
    color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][idx % 4]
  })).filter(item => item.value > 0);

  const defaultPieData = [{ name: 'Default Store', value: 10, color: '#3b82f6' }];
  const pieData = queueDistribution.length > 0 ? queueDistribution : defaultPieData;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Cluster Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time analytics and telemetry for job dispatches, node workloads, and retry pools.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Jobs Processed"
          value={completedCount}
          description="Completed job runs in active space"
          icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
          trend={{ value: 12.4, isPositive: true }}
          isLoading={isLoading}
        />
        <StatCard
          title="Running Jobs"
          value={runningCount}
          description="Active workflow executions"
          icon={<Play className="w-5 h-5 text-amber-500 animate-pulse" />}
          isLoading={isLoading}
        />
        <StatCard
          title="Queued Jobs"
          value={queuedCount}
          description="Jobs waiting in broker ring"
          icon={<Clock className="w-5 h-5 text-blue-500" />}
          trend={{ value: 8.2, isPositive: false }}
          isLoading={isLoading}
        />
        <StatCard
          title="Failed Jobs"
          value={failedCount}
          description="Runs containing execution errors"
          icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
          isLoading={isLoading}
        />
      </div>

      {/* Cluster Node Workload Placeholders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Workers Online"
          value={`${totalWorkers} Node${totalWorkers !== 1 ? 's' : ''}`}
          description="Active cluster daemon pools"
          icon={<Server className="w-5 h-5 text-purple-500" />}
          isLoading={isLoading}
        />
        <StatCard
          title="Average CPU Utilization"
          value={`${avgCpu}%`}
          description="Combined processing load"
          icon={<Cpu className="w-5 h-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <StatCard
          title="Average Memory Utilization"
          value={`${avgMemory}%`}
          description="Active execution heap size"
          icon={<Cpu className="w-5 h-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
      </div>

      {/* Telemetry Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Throughput Area Chart */}
        <div className="lg:col-span-2">
          <ChartCard title="Job Throughput" description="Success vs failure rates in the past hour" isLoading={isLoading}>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={throughputData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" name="Completed" />
                <Area type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorFailed)" name="Failed" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Queue Distribution */}
        <ChartCard title="Queue Load Distribution" description="Job capacity mapped by queue namespace" isLoading={isLoading}>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {pieData.map((entry, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Recent Activity Table Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-semibold">Recent Job Activity</h3>
            <span className="text-xs text-muted-foreground">Latest 5 events</span>
          </div>

          <div className="divide-y divide-border overflow-hidden">
            {isLoading ? (
              <div className="animate-pulse space-y-4 py-4">
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
                <div className="h-4 bg-muted rounded w-4/6"></div>
              </div>
            ) : jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No recent jobs logged</p>
            ) : (
              jobs.slice(0, 5).map((job) => (
                <div key={job.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{job.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">{job.id}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">
                      {job.startedAt ? new Date(job.startedAt).toLocaleTimeString() : 'Queued'}
                    </span>
                    <StatusBadge status={job.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Workers */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-semibold">Active Cluster Nodes</h3>
            <span className="text-xs text-muted-foreground">Heartbeat status</span>
          </div>

          <div className="divide-y divide-border overflow-hidden">
            {isLoading ? (
              <div className="animate-pulse space-y-4 py-4">
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
                <div className="h-4 bg-muted rounded w-4/6"></div>
              </div>
            ) : workers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No active worker daemons</p>
            ) : (
              workers.map((worker) => (
                <div key={worker.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{worker.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">CPU: {worker.cpuUtilization}% | RAM: {worker.memoryUtilization}%</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={worker.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
