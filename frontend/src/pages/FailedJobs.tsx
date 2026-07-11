import React, { useEffect, useState } from 'react';
import { useJobStore, Job } from '../store/JobStore';
import { useToast } from '../components/ui/Toast';
import { DataTable, Column } from '../components/ui/DataTable';
import { Button } from '../components/ui/Button';
import { Drawer } from '../components/ui/Drawer';
import { StatusBadge } from '../components/ui/StatusBadge';
import { JSONViewer } from '../components/ui/JSONViewer';
import { CodeBlock } from '../components/ui/CodeBlock';
import { RefreshCw, Play, Trash2, ShieldAlert } from 'lucide-react';

export const FailedJobs: React.FC = () => {
  const { jobs, fetchJobs, retryJob, deleteJob } = useJobStore();
  const { toast } = useToast();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const failedJobs = jobs.filter((j) => j.status === 'failed');

  const handleRetry = async (id: string) => {
    await retryJob(id);
    toast('Retry execution requested in control plane.', 'success');
    setIsDetailOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteJob(id);
    toast('Failed job record purged.', 'success');
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
      header: 'Error message',
      accessor: (j) => (
        <span className="text-xs text-red-500 font-mono line-clamp-1 max-w-sm">
          {j.error || 'Unknown runtime crash error'}
        </span>
      )
    },
    {
      header: 'Attempts',
      accessor: (j) => (
        <span className="text-xs font-semibold text-muted-foreground">
          {j.attempts} / {j.maxAttempts}
        </span>
      )
    },
    {
      header: 'Failed At',
      accessor: (j) => (
        <span className="text-xs text-muted-foreground">
          {j.failedAt ? new Date(j.failedAt).toLocaleTimeString() : 'Recently'}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: (j) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => handleRetry(j.id)} className="!p-1 h-auto">
            <RefreshCw className="w-4 h-4 text-green-500" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(j.id)} className="!p-1 h-auto">
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
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Failed Jobs / Retries</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Inspect failing system workflows, diagnostic stacks, and trigger manual retry pipelines.
        </p>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={failedJobs}
        onRowClick={(job) => {
          setSelectedJob(job);
          setIsDetailOpen(true);
        }}
        emptyTitle="Clean slate! No failed jobs logged"
        emptyDescription="All active workflow events are processing within specifications."
      />

      {/* Details drawer */}
      <Drawer
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedJob ? `Failing Job: ${selectedJob.name}` : ''}
        footer={
          <div className="flex gap-2">
            <Button onClick={() => handleRetry(selectedJob!.id)}>
              Retry Job
            </Button>
            <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        {selectedJob && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Failing Exception Details</h3>
              <div className="mt-2 text-xs text-red-400 bg-red-950/20 p-4 rounded-xl border border-red-500/20 font-mono whitespace-pre-wrap">
                {selectedJob.error || 'Unknown runtime error'}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Execution History Timeline</h3>
              <div className="mt-2 bg-muted/20 p-4 rounded-xl border border-border space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Attempt Count</span>
                  <span className="text-foreground font-semibold">{selectedJob.attempts} of {selectedJob.maxAttempts} max</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Broker Ring Queue</span>
                  <span className="font-mono text-foreground">{selectedJob.queueId}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Parameters Payload</h3>
              <JSONViewer data={selectedJob.payload} />
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Historical Logs</h3>
              <CodeBlock code={selectedJob.logs.join('\n')} language="log" />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
export default FailedJobs;
