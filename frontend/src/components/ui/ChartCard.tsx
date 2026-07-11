import React from 'react';

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  isLoading?: boolean;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  description,
  children,
  action,
  isLoading
}) => {
  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col justify-between shadow-sm">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-base font-semibold text-card-foreground leading-6">{title}</h3>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>

      <div className="relative min-h-[240px] flex-grow flex items-center justify-center">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-card/50">
            <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : children}
      </div>
    </div>
  );
};
export default ChartCard;
