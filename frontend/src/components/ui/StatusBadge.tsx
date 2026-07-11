import React from 'react';

type StatusType = 'queued' | 'running' | 'completed' | 'failed' | 'scheduled' | 'online' | 'busy' | 'offline';

interface StatusBadgeProps {
  status: StatusType | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = status.toLowerCase() as StatusType;

  const styles: Record<StatusType, string> = {
    queued: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    running: 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse',
    completed: 'bg-green-500/10 text-green-500 border-green-500/20',
    failed: 'bg-red-500/10 text-red-500 border-red-500/20',
    scheduled: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    online: 'bg-green-500/10 text-green-500 border-green-500/20',
    busy: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    offline: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
  };

  const currentStyle = styles[normalized] || 'bg-muted text-muted-foreground border-border';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${currentStyle}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};
export default StatusBadge;
