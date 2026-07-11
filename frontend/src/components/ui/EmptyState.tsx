import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'Get started by creating a new entry.',
  action,
  icon
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-xl text-center bg-card/25">
      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-muted text-muted-foreground mb-4">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};
export default EmptyState;
