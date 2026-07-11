import React, { useEffect, useState } from 'react';
import { useWorkerStore, Worker } from '../store/WorkerStore';
import { useToast } from '../components/ui/Toast';
import { Drawer } from '../components/ui/Drawer';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Server, Activity, Plus, RefreshCw, Trash2, StopCircle, PlayCircle } from 'lucide-react';

export const Workers: React.FC = () => {
  const { workers, fetchWorkers, registerWorker, startWorker, stopWorker, deleteWorker } = useWorkerStore();
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const openDetails = (w: Worker) => {
    setSelectedWorker(w);
    setIsDetailOpen(true);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkerName.trim()) {
      toast('Worker name is required', 'error');
      return;
    }
    setActionLoading(true);
    await registerWorker(newWorkerName);
    setActionLoading(false);
    setIsRegisterOpen(false);
    setNewWorkerName('');
    toast(`Worker "${newWorkerName}" registered.`, 'success');
    fetchWorkers();
  };

  const handleStart = async (id: string, name: string) => {
    setActionLoading(true);
    await startWorker(id);
    setActionLoading(false);
    toast(`Worker "${name}" daemon started.`, 'success');
    setIsDetailOpen(false);
    fetchWorkers();
  };

  const handleStop = async (id: string, name: string) => {
    setActionLoading(true);
    await stopWorker(id);
    setActionLoading(false);
    toast(`Worker "${name}" daemon shutdown requested.`, 'success');
    setIsDetailOpen(false);
    fetchWorkers();
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete worker "${name}"?`)) {
      setActionLoading(true);
      await deleteWorker(id);
      setActionLoading(false);
      toast(`Worker "${name}" deleted.`, 'success');
      setIsDetailOpen(false);
      fetchWorkers();
    }
  };

  const getMeterColor = (val: number) => {
    if (val > 80) return 'bg-red-500';
    if (val > 50) return 'bg-amber-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Cluster Workers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor system daemon heartbeats, CPU/RAM utilization and execution threads.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => fetchWorkers()} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button onClick={() => setIsRegisterOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Register Node
          </Button>
        </div>
      </div>

      {/* Grid of nodes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workers.map((w) => (
          <div
            key={w.id}
            onClick={() => openDetails(w)}
            className="bg-card border border-border rounded-xl p-6 hover:border-muted-foreground/30 transition-all shadow-sm cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-muted text-muted-foreground">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground leading-none">{w.name}</h3>
                    <span className="text-[10px] text-muted-foreground font-mono mt-1 block">{w.id}</span>
                  </div>
                </div>
                <StatusBadge status={w.status} />
              </div>

              {/* Resource Utilization Meters */}
              <div className="mt-6 space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">CPU Core Load</span>
                    <span className="font-semibold text-foreground">{w.cpuUtilization.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getMeterColor(w.cpuUtilization)} transition-all duration-500`}
                      style={{ width: `${w.cpuUtilization}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Memory Buffer heap</span>
                    <span className="font-semibold text-foreground">{w.memoryUtilization.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getMeterColor(w.memoryUtilization)} transition-all duration-500`}
                      style={{ width: `${w.memoryUtilization}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
              <span>{w.activeJobs.length} active process runs</span>
              <span>Heartbeat: {w.lastHeartbeat ? new Date(w.lastHeartbeat).toLocaleTimeString() : 'N/A'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Register Node Modal */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Register Cluster Node"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsRegisterOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRegister} isLoading={actionLoading}>
              Register
            </Button>
          </>
        }
      >
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Worker Node Name
            </label>
            <input
              type="text"
              required
              value={newWorkerName}
              onChange={(e) => setNewWorkerName(e.target.value)}
              placeholder="e.g. worker-node-west"
              className="mt-1.5 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none"
            />
          </div>
        </form>
      </Modal>

      {/* Detail Panel Drawer */}
      <Drawer
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedWorker ? `Cluster Daemon: ${selectedWorker.name}` : ''}
        footer={
          selectedWorker && (
            <div className="flex gap-2">
              {selectedWorker.status === 'offline' ? (
                <Button onClick={() => handleStart(selectedWorker.id, selectedWorker.name)} className="flex items-center gap-2">
                  <PlayCircle className="w-4 h-4" />
                  Start Daemon
                </Button>
              ) : (
                <Button onClick={() => handleStop(selectedWorker.id, selectedWorker.name)} className="flex items-center gap-2" variant="destructive">
                  <StopCircle className="w-4 h-4" />
                  Stop Daemon
                </Button>
              )}
              <Button onClick={() => handleDelete(selectedWorker.id, selectedWorker.name)} variant="ghost" className="text-red-500 hover:bg-red-500/10">
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>
                Close
              </Button>
            </div>
          )
        }
      >
        {selectedWorker && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cluster Node Information</h3>
              <div className="mt-2 bg-muted/20 p-4 rounded-xl border border-border space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Worker Node ID</span>
                  <span className="font-mono text-foreground font-semibold">{selectedWorker.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Host Daemon Name</span>
                  <span className="text-foreground">{selectedWorker.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current State</span>
                  <StatusBadge status={selectedWorker.status} />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Uptime Heat</span>
                  <span className="text-foreground font-semibold">99.98%</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Workload Tasks</h3>
              <div className="mt-2 space-y-2">
                {selectedWorker.activeJobs.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic bg-muted/10 p-4 rounded-lg border border-border text-center">
                    No active job threads processing on this worker.
                  </p>
                ) : (
                  selectedWorker.activeJobs.map((jId) => (
                    <div key={jId} className="flex justify-between items-center bg-muted/30 p-3 rounded-lg border border-border text-xs">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-amber-500 animate-pulse" />
                        <span className="font-mono font-semibold">{jId}</span>
                      </div>
                      <StatusBadge status="running" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
export default Workers;
