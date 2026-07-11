import React, { useEffect, useState } from 'react';
import { useJobStore, Job } from '../store/JobStore';
import { useToast } from '../components/ui/Toast';
import { DataTable, Column } from '../components/ui/DataTable';
import { Button } from '../components/ui/Button';
import { Drawer } from '../components/ui/Drawer';
import { StatusBadge } from '../components/ui/StatusBadge';
import { JSONViewer } from '../components/ui/JSONViewer';
import { CodeBlock } from '../components/ui/CodeBlock';
import { RefreshCw, Trash2 } from 'lucide-react';

export const DeadLetterQueue: React.FC = () => {
  const { jobs, fetchJobs, retryJob, deleteJob } = useJobStore();
  const { toast } = useToast();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // DLQ: Jobs that have failed and exhausted their attempts
  const dlqJobs = jobs.filter((j) => j.status === 'failed' && j.attempts >= j.maxAttempts);

  const handleRetry = async (id: string) => {
    await retryJob(id);
    toast('Job re-queued and retried from DLQ.', 'success');
    setIsDetailOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteJob(id);
    toast('DLQ record purged.', 'success');
    setIsDetailOpen(false);
  };

  const columns: Column<Job>[] = [
    {
      header: 'Job ID & Name',
      accessor: (j) => (
        <div>
          <span className="font-semibold text-foreground">{j.name}</span>
          <span className="block text-[10px] text-muted-foreground font-mono mt-0.5">{j.id}</span>
        </div>
      )
    },
    {
      header: 'Fatal Crash Error',
      accessor: (j) => (
        <span className="text-xs text-red-500 font-mono line-clamp-1 max-w-sm">
          {j.error || 'Max retry attempts exhausted'}
        </span>
      )
    },
    {
      header: 'Att. Limit',
      accessor: (j) => (
        <span className="text-xs text-muted-foreground font-medium">
          {j.attempts} / {j.maxAttempts} max
        </span>
      )
    },
    {
      header: 'Purge / Retry',
      accessor: (j) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => handleRetry(j.id)} className="!p-1 h-auto" title="Retry and restore">
            <RefreshCw className="w-4 h-4 text-green-500" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(j.id)} className="!p-1 h-auto" title="Purge job record">
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dead Letter Queue (DLQ)</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Inspect toxic jobs that have exceeded all automatic backoff schedules. Manually retry or purge them.
        </p>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={dlqJobs}
        onRowClick={(job) => {
          setSelectedJob(job);
          setIsDetailOpen(true);
        }}
        emptyTitle="DLQ is empty! Nice job"
        emptyDescription="No toxic jobs are currently stalled in the dead letter queues."
      />

      {/* Detail drawer */}
      <Drawer
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedJob ? `DLQ Audit: ${selectedJob.name}` : ''}
        footer={
          <div className="flex gap-2">
            <Button onClick={() => handleRetry(selectedJob!.id)}>
              Retry Job
            </Button>
            <Button variant="destructive" onClick={() => handleDelete(selectedJob!.id)}>
              Purge Record
            </Button>
          </div>
        }
      >
        {selectedJob && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fatal Reason</h3>
              <div className="mt-2 text-xs text-red-400 bg-red-950/20 p-4 rounded-xl border border-red-500/20 font-mono">
                {selectedJob.error || 'MaxAttemptsReached: Job failed all retries.'}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Audit Parameters</h3>
              <JSONViewer data={selectedJob.payload} />
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Execution Traces</h3>
              <CodeBlock code={selectedJob.logs.join('\n')} language="log" />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
export default DeadLetterQueue;
