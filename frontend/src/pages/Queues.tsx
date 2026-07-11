import React, { useEffect, useState } from 'react';
import { useQueueStore, Queue } from '../store/QueueStore';
import { useProjectStore } from '../store/ProjectStore';
import { useToast } from '../components/ui/Toast';
import { DataTable, Column } from '../components/ui/DataTable';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Drawer } from '../components/ui/Drawer';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Plus, Play, Pause, Settings, RefreshCw, Layers } from 'lucide-react';

export const Queues: React.FC = () => {
  const { queues, fetchQueues, createQueue, togglePause, updateQueue } = useQueueStore();
  const { activeProject } = useProjectStore();
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null);

  // Form State
  const [qName, setQName] = useState('');
  const [qConcurrency, setQConcurrency] = useState(5);
  const [qPriority, setQPriority] = useState<'low' | 'normal' | 'high' | 'critical'>('normal');
  const [qAttempts, setQAttempts] = useState(3);
  const [qBackoff, setQBackoff] = useState(2);
  const [qDelay, setQDelay] = useState(2000);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchQueues(activeProject?.id);
  }, [fetchQueues, activeProject]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qName.trim()) {
      toast('Queue name is required', 'error');
      return;
    }
    setIsLoading(true);
    await createQueue({
      id: `q-${qName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name: qName,
      projectId: activeProject?.id || 'proj-default',
      concurrency: qConcurrency,
      priority: qPriority,
      paused: false,
      retryPolicy: {
        attempts: qAttempts,
        backoffFactor: qBackoff,
        delay: qDelay
      }
    });
    setIsLoading(false);
    setIsCreateOpen(false);
    setQName('');
    toast(`Queue "${qName}" initialized.`, 'success');
  };

  const handleTogglePause = async (id: string, name: string) => {
    await togglePause(id);
    toast(`Queue "${name}" state updated.`, 'success');
  };

  const openDetails = (queue: Queue) => {
    setSelectedQueue(queue);
    setIsDetailOpen(true);
  };

  // Define Columns for DataTable
  const columns: Column<Queue>[] = [
    {
      header: 'Queue Name',
      accessor: (q) => (
        <div>
          <span className="font-semibold text-foreground">{q.name}</span>
          <span className="block text-[10px] text-muted-foreground font-mono mt-0.5">{q.id}</span>
        </div>
      )
    },
    {
      header: 'Concurrency',
      accessor: (q) => (
        <span className="font-semibold">{q.concurrency} concurrent runners</span>
      )
    },
    {
      header: 'Priority',
      accessor: (q) => <StatusBadge status={q.priority} />
    },
    {
      header: 'Status',
      accessor: (q) => <StatusBadge status={q.paused ? 'offline' : 'online'} />
    },
    {
      header: 'Queued',
      accessor: (q) => <span className="font-semibold text-blue-500">{q.metrics.queued}</span>
    },
    {
      header: 'Active',
      accessor: (q) => <span className="font-semibold text-amber-500">{q.metrics.running}</span>
    },
    {
      header: 'Completed',
      accessor: (q) => <span className="font-semibold text-green-500">{q.metrics.completed}</span>
    },
    {
      header: 'Actions',
      accessor: (q) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleTogglePause(q.id, q.name)}
            className="!p-1 h-auto"
          >
            {q.paused ? <Play className="w-4 h-4 text-green-500" /> : <Pause className="w-4 h-4 text-amber-500" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openDetails(q)}
            className="!p-1 h-auto"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Broker Queues</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage thread pools, rate limits, priority distributions, and concurrency control per namespace.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Queue
        </Button>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={queues}
        onRowClick={openDetails}
        emptyTitle="No queues deployed"
        emptyDescription="Create a queue to partition your jobs into concurrency lines."
      />

      {/* Create Queue Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Deploy New Broker Queue"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} isLoading={isLoading}>
              Deploy Queue
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Queue Name
            </label>
            <input
              type="text"
              required
              value={qName}
              onChange={(e) => setQName(e.target.value)}
              placeholder="e.g. transactional-emails"
              className="mt-1.5 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Max Concurrency
              </label>
              <input
                type="number"
                min={1}
                value={qConcurrency}
                onChange={(e) => setQConcurrency(Number(e.target.value))}
                className="mt-1.5 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Priority Tier
              </label>
              <select
                value={qPriority}
                onChange={(e) => setQPriority(e.target.value as any)}
                className="mt-1.5 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="low">Low Priority</option>
                <option value="normal">Normal Priority</option>
                <option value="high">High Priority</option>
                <option value="critical">Critical Priority</option>
              </select>
            </div>
          </div>

          <div className="border-t border-border pt-4 mt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider mb-3 text-foreground">Retry Backoff Policy</h4>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground">Attempts</label>
                <input
                  type="number"
                  min={1}
                  value={qAttempts}
                  onChange={(e) => setQAttempts(Number(e.target.value))}
                  className="mt-1 w-full h-9 px-2 rounded-lg border border-input bg-background text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground">Backoff Fact.</label>
                <input
                  type="number"
                  min={1}
                  value={qBackoff}
                  onChange={(e) => setQBackoff(Number(e.target.value))}
                  className="mt-1 w-full h-9 px-2 rounded-lg border border-input bg-background text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground">Delay (ms)</label>
                <input
                  type="number"
                  min={0}
                  value={qDelay}
                  onChange={(e) => setQDelay(Number(e.target.value))}
                  className="mt-1 w-full h-9 px-2 rounded-lg border border-input bg-background text-xs"
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Queue Details Drawer */}
      <Drawer
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedQueue ? `Queue settings: ${selectedQueue.name}` : ''}
        footer={
          <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>
            Close
          </Button>
        }
      >
        {selectedQueue && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Namespace Details</h3>
              <div className="mt-2 bg-muted/30 p-4 rounded-xl space-y-2 border border-border">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Namespace ID</span>
                  <span className="font-mono text-foreground font-semibold">{selectedQueue.id}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Project Space</span>
                  <span className="font-semibold text-foreground">{selectedQueue.projectId}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge status={selectedQueue.paused ? 'offline' : 'online'} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Broker Policies</h3>
              <div className="mt-2 bg-muted/30 p-4 rounded-xl space-y-2 border border-border">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Concurrency Pool</span>
                  <span className="font-semibold text-foreground">{selectedQueue.concurrency} concurrent tasks</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Scheduling Priority</span>
                  <StatusBadge status={selectedQueue.priority} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Backoff Retry Logic</h3>
              <div className="mt-2 bg-muted/30 p-4 rounded-xl space-y-2 border border-border">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Retry Attempts Limit</span>
                  <span className="font-semibold text-foreground">{selectedQueue.retryPolicy.attempts} times</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Exponential Factor</span>
                  <span className="font-semibold text-foreground">{selectedQueue.retryPolicy.backoffFactor}x</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Initial Delay</span>
                  <span className="font-semibold text-foreground">{selectedQueue.retryPolicy.delay} ms</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
export default Queues;
