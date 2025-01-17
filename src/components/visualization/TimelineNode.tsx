import React from 'react';
import type { TimelineEvent } from '@/pages/Index';

interface TimelineNodeProps {
  event: TimelineEvent;
}

export const TimelineNode: React.FC<TimelineNodeProps> = ({ event }) => {
  const formattedTimestamp = new Date(event.timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short'
  });

  return (
    <div className="p-2 max-w-[300px] bg-background text-foreground">
      <div className="font-medium truncate">{event.title || 'Untitled Event'}</div>
      <div className="text-xs text-muted-foreground truncate">{formattedTimestamp}</div>
      {event.host && (
        <div className="text-xs mt-1">
          <span className="font-medium">Host:</span> {event.host}
        </div>
      )}
      {event.user && (
        <div className="text-xs">
          <span className="font-medium">User:</span> {event.user}
        </div>
      )}
      {event.process && (
        <div className="text-xs">
          <span className="font-medium">Process:</span> {event.process}
        </div>
      )}
      {event.sha256 && (
        <div className="text-xs">
          <span className="font-medium">SHA256:</span> {event.sha256.substring(0, 8)}...
        </div>
      )}
      {event.networkDetails && (
        <div className="text-xs mt-1">
          {event.networkDetails.proxyIp && (
            <div><span className="font-medium">Proxy:</span> {event.networkDetails.proxyIp}</div>
          )}
          {event.networkDetails.port && (
            <div><span className="font-medium">Port:</span> {event.networkDetails.port}</div>
          )}
          {event.networkDetails.destinationIp && (
            <div><span className="font-medium">Destination:</span> {event.networkDetails.destinationIp}</div>
          )}
        </div>
      )}
      {event.technique && (
        <div className="mt-1">
          <span className="inline-block px-2 py-1 text-xs bg-primary/10 text-primary rounded">
            {event.technique}
          </span>
        </div>
      )}
    </div>
  );
};