import React from 'react';
import { Calendar, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export interface TimelineEvent {
  title: string;
  timestamp: string;
  description?: string;
  status?: 'success' | 'failure' | 'pending';
}

interface TimelineProps {
  events: TimelineEvent[];
}

export const Timeline: React.FC<TimelineProps> = ({ events }) => {
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {events.map((event, idx) => (
          <li key={idx}>
            <div className="relative pb-8">
              {idx !== events.length - 1 && (
                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-border" aria-hidden="true" />
              )}
              <div className="relative flex space-x-3">
                <div>
                  <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-card ${
                    event.status === 'success' ? 'bg-green-500/10 text-green-500' :
                    event.status === 'failure' ? 'bg-red-500/10 text-red-500' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {event.status === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
                     event.status === 'failure' ? <XCircle className="w-5 h-5" /> :
                     <Calendar className="w-5 h-5" />}
                  </span>
                </div>
                <div className="flex-grow pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{event.title}</p>
                    {event.description && (
                      <p className="text-xs text-muted-foreground mt-1 max-w-md">{event.description}</p>
                    )}
                  </div>
                  <div className="text-right text-xs whitespace-nowrap text-muted-foreground">
                    <time dateTime={event.timestamp}>
                      {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
export default Timeline;
