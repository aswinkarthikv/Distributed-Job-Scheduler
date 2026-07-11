import React, { useEffect, useState } from 'react';
import { useJobStore, Job } from '../store/JobStore';
import { useQueueStore } from '../store/QueueStore';
import { useProjectStore } from '../store/ProjectStore';
import { useToast } from '../components/ui/Toast';
import { DataTable, Column } from '../components/ui/DataTable';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Drawer } from '../components/ui/Drawer';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Timeline, TimelineEvent } from '../components/ui/Timeline';
import { JSONViewer } from '../components/ui/JSONViewer';
import { CodeBlock } from '../components/ui/CodeBlock';
import { SearchInput } from '../components/ui/SearchInput';
import { FilterPanel } from '../components/ui/FilterPanel';
import { Pagination } from '../components/ui/Pagination';
import { Plus, Play, Trash2, HelpCircle, Activity } from 'lucide-react';

export const Jobs: React.FC = () => {
  const { jobs, fetchJobs, createJob, retryJob, deleteJob } = useJobStore();
  const { queues, fetchQueues } = useQueueStore();
  const { activeProject } = useProjectStore();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [queueFilter, setQueueFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Form State
  const [jobName, setJobName] = useState('');
  const [targetQueue, setTargetQueue] = useState('');
  const [payloadStr, setPayloadStr] = useState('{\n  "userId": "usr_99",\n  "syncType": "delta"\n}');
  const [priority, setPriority] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [retryDelay, setRetryDelay] = useState(5000);
  const [runAt, setRunAt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchJobs({ projectId: activeProject?.id });
    fetchQueues(activeProject?.id);
  }, [fetchJobs, fetchQueues, activeProject]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobName.trim()) {
      toast('Job name is required', 'error');
      return;
    }
    let parsedPayload = {};
    try {
      parsedPayload = JSON.parse(payloadStr);
    } catch {
      toast('Payload must be a valid JSON object', 'error');
      return;
    }

    setIsLoading(true);
    await createJob({
      name: jobName,
      projectId: activeProject?.id || 'proj-default',
      queueId: targetQueue || queues[0]?.id || 'q-high-priority',
      payload: parsedPayload,
      priority,
      maxAttempts,
      delay: retryDelay,
      runAt: runAt ? new Date(runAt).toISOString() : undefined
    });
    setIsLoading(false);
    setIsCreateOpen(false);
    setJobName('');
    toast(`Job "${jobName}" created and queued.`, 'success');
  };

  const handleRetry = async (id: string) => {
    await retryJob(id);
    toast('Retry event dispatched to workers.', 'success');
    setIsDetailOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteJob(id);
    toast('Job record removed.', 'success');
    setIsDetailOpen(false);
  };

  const openDetails = (job: Job) => {
    setSelectedJob(job);
    setIsDetailOpen(true);
  };

  // Filters and Searching
  const filteredJobs = jobs.filter((j) => {
    const matchesSearch = j.name.toLowerCase().includes(search.toLowerCase()) || j.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || j.status === statusFilter;
    const matchesQueue = queueFilter === 'all' || j.queueId === queueFilter;
    return matchesSearch && matchesStatus && matchesQueue;
  });

  // Pagination
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
      header: 'Queue',
      accessor: (j) => <span className="font-mono text-xs">{j.queueId}</span>
    },
    {
      header: 'Status',
      accessor: (j) => <StatusBadge status={j.status} />
    },
    {
      header: 'Attempts',
      accessor: (j) => (
        <span className="text-xs font-medium text-muted-foreground">
          {j.attempts} / {j.maxAttempts}
        </span>
      )
    },
    {
      header: 'Trigger Date',
      accessor: (j) => (
        <span className="text-xs text-muted-foreground">
          {j.startedAt ? new Date(j.startedAt).toLocaleTimeString() : 'Pending'}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: (j) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {j.status === 'failed' && (
            <Button variant="ghost" size="sm" onClick={() => handleRetry(j.id)} className="!p-1 h-auto">
              <Play className="w-4 h-4 text-green-500" />
            </Button>
          )}
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Job Registry</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Audit executing worker tasks, payloads, outcomes, and timelines.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Enqueue Job
        </Button>
      </div>

      {/* Filter panel */}
      <div className="bg-card border border-border p-6 rounded-xl flex flex-col md:flex-row gap-6 justify-between items-start md:items-center shadow-sm">
        <SearchInput value={search} onValueChange={setSearch} placeholder="Search jobs by ID or task name..." />

        <div className="flex flex-wrap gap-6 items-center">
          <FilterPanel
            label="Status"
            options={[
              { label: 'All', value: 'all' },
              { label: 'Queued', value: 'queued' },
              { label: 'Running', value: 'running' },
              { label: 'Completed', value: 'completed' },
              { label: 'Failed', value: 'failed' },
              { label: 'Scheduled', value: 'scheduled' }
            ]}
            selectedValue={statusFilter}
            onSelect={setStatusFilter}
          />
        </div>
      </div>

      {/* Main Registry Table */}
      <div className="space-y-4">
        <DataTable
          columns={columns}
          data={paginatedJobs}
          onRowClick={openDetails}
          emptyTitle="No jobs found"
          emptyDescription="Enqueue a new job or clear active filters."
        />
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Enqueue Control Plane Job"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} isLoading={isLoading}>
              Enqueue Job
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Task Name
              </label>
              <input
                type="text"
                required
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder="e.g. Ingest Customer Data"
                className="mt-1.5 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Queue Line
              </label>
              <select
                value={targetQueue}
                onChange={(e) => setTargetQueue(e.target.value)}
                className="mt-1.5 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none"
              >
                {queues.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              JSON Parameters Payload
            </label>
            <textarea
              required
              rows={4}
              value={payloadStr}
              onChange={(e) => setPayloadStr(e.target.value)}
              className="mt-1.5 w-full p-3 rounded-lg border border-input bg-background text-xs font-mono text-foreground focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground">Priority</label>
              <input
                type="number"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="mt-1 w-full h-9 px-2 rounded-lg border border-input bg-background text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground">Max Attempts</label>
              <input
                type="number"
                min={1}
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(Number(e.target.value))}
                className="mt-1 w-full h-9 px-2 rounded-lg border border-input bg-background text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground">Delay (ms)</label>
              <input
                type="number"
                min={0}
                value={retryDelay}
                onChange={(e) => setRetryDelay(Number(e.target.value))}
                className="mt-1 w-full h-9 px-2 rounded-lg border border-input bg-background text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Schedule Run At (Optional)
            </label>
            <input
              type="datetime-local"
              value={runAt}
              onChange={(e) => setRunAt(e.target.value)}
              className="mt-1.5 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none"
            />
          </div>
        </form>
      </Modal>

      {/* Details Drawer */}
      <Drawer
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedJob ? `Job Audit: ${selectedJob.name}` : ''}
        footer={
          selectedJob?.status === 'failed' ? (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => handleRetry(selectedJob.id)}>
                Retry Job Now
              </Button>
              <Button variant="ghost" onClick={() => setIsDetailOpen(false)}>
                Close
              </Button>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>
              Close
            </Button>
          )
        }
      >
        {selectedJob && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Metadata</h3>
              <div className="mt-2 bg-muted/20 p-4 rounded-xl border border-border space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Job Identifier</span>
                  <span className="font-mono text-foreground font-semibold">{selectedJob.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Broker Line</span>
                  <span className="font-mono text-foreground">{selectedJob.queueId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status Flag</span>
                  <StatusBadge status={selectedJob.status} />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Attempts Taken</span>
                  <span className="font-medium text-foreground">{selectedJob.attempts} / {selectedJob.maxAttempts}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Parameters Payload</h3>
              <div className="mt-2">
                <JSONViewer data={selectedJob.payload} />
              </div>
            </div>

            {selectedJob.result && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Execution Outcome</h3>
                <div className="mt-2">
                  <JSONViewer data={selectedJob.result} />
                </div>
              </div>
            )}

            {selectedJob.error && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-red-500">Trace Error Stack</h3>
                <div className="mt-2 text-xs text-red-400 bg-red-950/20 p-3 rounded-lg border border-red-500/20 font-mono">
                  {selectedJob.error}
                </div>
              </div>
            )}

            {/* Execution logs */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Execution Console Traces</h3>
              <div className="mt-2">
                <CodeBlock code={selectedJob.logs.join('\n')} language="log" />
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
export default Jobs;
