import React, { useEffect, useState } from 'react';
import { useProjectStore, Project } from '../store/ProjectStore';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { FolderPlus, Trash2, Calendar, HardDrive, Cpu, ExternalLink } from 'lucide-react';

export const Projects: React.FC = () => {
  const { projects, fetchProjects, createProject, deleteProject } = useProjectStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProj, setSelectedProj] = useState<Project | null>(null);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) {
      toast('Project name is required', 'error');
      return;
    }
    setIsLoading(true);
    await createProject(newProjName, newProjDesc);
    setIsLoading(false);
    setIsCreateOpen(false);
    setNewProjName('');
    setNewProjDesc('');
    toast(`Project "${newProjName}" created.`, 'success');
  };

  const handleDeleteTrigger = (proj: Project) => {
    setSelectedProj(proj);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedProj) {
      await deleteProject(selectedProj.id);
      setIsDeleteOpen(false);
      toast(`Project "${selectedProj.name}" deleted.`, 'success');
      setSelectedProj(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Projects / Spaces</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Group workflows, queues, configuration namespaces, and API tokens into secure sandboxes.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
          <FolderPlus className="w-4 h-4" />
          Create Space
        </Button>
      </div>

      {/* Grid of Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((proj) => (
          <div key={proj.id} className="bg-card border border-border rounded-xl p-6 flex flex-col justify-between hover:border-muted-foreground/30 transition-all shadow-sm group">
            <div>
              <div className="flex justify-between items-start">
                <h3 className="text-base font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors">
                  {proj.name}
                </h3>
                <button
                  onClick={() => handleDeleteTrigger(proj)}
                  className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2 min-h-8">
                {proj.description || 'No description provided.'}
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                <span>Namespace ID:</span>
                <span className="bg-muted px-1.5 py-0.5 rounded text-foreground">{proj.id}</span>
              </div>
            </div>

            {/* Metrics Footer */}
            <div className="mt-6 border-t border-border pt-4 flex justify-between items-center text-xs text-muted-foreground">
              <div className="flex gap-4">
                <span className="flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5 text-blue-500" />
                  {proj.queueCount} Queue{proj.queueCount !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-amber-500" />
                  {proj.activeJobsCount} Active
                </span>
              </div>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(proj.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Project Space"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} isLoading={isLoading}>
              Create Project
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Space Name
            </label>
            <input
              type="text"
              required
              value={newProjName}
              onChange={(e) => setNewProjName(e.target.value)}
              placeholder="e.g. Sync Services"
              className="mt-1.5 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Description
            </label>
            <textarea
              value={newProjDesc}
              onChange={(e) => setNewProjDesc(e.target.value)}
              placeholder="Primary namespaces for database synchronization and webhooks triggers..."
              rows={3}
              className="mt-1.5 w-full p-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Space"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Confirm Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete the space <strong className="text-foreground">"{selectedProj?.name}"</strong>?
          This action will permanently delete all associated queues, job records, scheduled triggers, and log traces.
        </p>
      </Modal>
    </div>
  );
};
export default Projects;
