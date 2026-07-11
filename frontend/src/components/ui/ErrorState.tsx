import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'An error occurred',
  description = 'Failed to load configuration or active status. Please try again.',
  onRetry
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 border border-border rounded-xl text-center bg-destructive/5">
      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-destructive/10 text-destructive mb-4">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
      {onRetry && (
        <div className="mt-6">
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
};
export default ErrorState;
