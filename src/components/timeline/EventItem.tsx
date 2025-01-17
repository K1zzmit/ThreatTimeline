import React from 'react';
import type { TimelineEvent } from '@/pages/Index';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { EventContent } from './event-item/EventContent';
import { EventActions } from './event-item/EventActions';
import { cn, formatTimestamp, getEventColor } from '@/lib/utils';
import { getTechniqueId } from '@/lib/mitre';
import { GripVertical, Search, Terminal, ChevronRight, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface EventItemProps {
  event: TimelineEvent;
  events: TimelineEvent[];
  onClick: (event: TimelineEvent) => void;
  onDelete: (eventId: string) => void;
  onUpdateEvent: (event: TimelineEvent) => void;
  onAddEvent: (parentId?: string) => void;
  parentEvent?: TimelineEvent;
  depth?: number;
  isLinkingMode?: boolean;
  isLinkSource?: boolean;
  isEditMode?: boolean;
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: (eventId: string) => void;
  hasChildren?: boolean;
}

export const EventItem: React.FC<EventItemProps> = ({ 
  event, 
  events,
  onClick,
  onDelete,
  onUpdateEvent,
  onAddEvent,
  parentEvent,
  depth = 0,
  isLinkingMode = false,
  isLinkSource = false,
  isEditMode = false,
  className = '',
  isCollapsed = false,
  onToggleCollapse,
  hasChildren = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging
  } = useDraggable({
    id: event.id,
    disabled: !isEditMode
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: event.id,
    disabled: !isEditMode
  });

  // Combine drag and drop refs
  const setRefs = (element: HTMLDivElement) => {
    if (element) {
      setDragRef(element);
      setDropRef(element);
    }
  };

  const handleClick = (e: React.MouseEvent, view?: 'search' | 'log') => {
    e.stopPropagation();
    onClick({ ...event, initialView: view });
  };

  const style: React.CSSProperties = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
    cursor: isEditMode ? 'grab' : 'pointer',
    zIndex: isDragging ? 50 : 1,
    position: 'relative',
    marginLeft: `${depth * 20}px`,
    marginBottom: '0.5rem'
  } : {
    cursor: isEditMode ? 'grab' : 'pointer',
    zIndex: isDragging ? 50 : 1,
    position: 'relative',
    marginLeft: `${depth * 20}px`,
    marginBottom: '0.5rem'
  };

  // Get background color based on parent relationship
  const getBackgroundColor = () => {
    if (event.tactic) {
      return `bg-${event.tactic.toLowerCase().replace(/ /g, '-')}/10`;
    }
    // Use a subtle background for all events
    return 'bg-card/50 dark:bg-card/50';
  };

  // Safer depth calculation with cycle detection
  const calculateDepth = (eventId: string, visited = new Set<string>()): number => {
    if (visited.has(eventId)) return 0; // Prevent infinite loops
    
    const currentEvent = events.find(e => e.id === eventId);
    if (!currentEvent?.parentId) return 0;
    
    visited.add(eventId);
    return 1 + calculateDepth(currentEvent.parentId, visited);
  };

  // Calculate border color safely
  const getBorderColor = () => {
    try {
      const eventDepth = calculateDepth(event.id);
      for (let num in events) {
        if (events[num].id === event.id) {
          events[num].color = getEventColor(eventDepth).slice(6);
        }
      }
      return getEventColor(eventDepth);
    } catch (error) {
      console.error('Error calculating event depth:', error);
      return 'border-gray-500'; // Fallback color
    }
  };

  const borderColorClass = getBorderColor();

  return (
    <div 
      ref={setRefs}
      {...attributes}
      {...listeners}
      data-event-id={event.id}
      className={cn(
        "group relative pl-4 pr-2 py-2 hover:bg-accent/50 rounded-lg transition-colors border border-l-4 shadow-sm",
        getBackgroundColor(),
        isOver && "ring-2 ring-primary",
        isLinkSource && "ring-2 ring-primary",
        borderColorClass,
        isDragging && "opacity-50",
        className
      )}
      style={style}
      onClick={(e) => handleClick(e)}
    >
      <div className="flex items-center justify-between gap-2">
        {isEditMode && (
          <div className="flex items-center self-stretch px-1 -ml-2 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {hasChildren && onToggleCollapse && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCollapse(event.id);
                }}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
            <span className="text-sm text-muted-foreground">
              {formatTimestamp(event.timestamp, event.timezone)}
            </span>
            <span className={cn(
              "font-medium truncate",
              (event.tactic === "Lateral Movement" || event.lateralMovementSource) && "text-red-500"
            )}>
              {event.title || "Untitled Event"}
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground mt-1">
            {event.description}
          </p>

          {/* MITRE Details */}
          {event.tactic && event.technique && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">{event.tactic}</Badge>
              <Badge variant="outline">{event.technique}</Badge>
            </div>
          )}

          {/* Artifacts */}
          {event.artifacts && event.artifacts.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {event.artifacts.map((artifact, i) => (
                <div key={i} className="bg-muted/50 p-2 rounded-sm">
                  <div className="text-xs text-muted-foreground">{artifact.name}</div>
                  <div className="text-sm font-mono truncate">{artifact.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-2">
            <EventActions 
              eventId={event.id}
              onDelete={onDelete}
              onUpdateEvent={onUpdateEvent}
              onAddEvent={onAddEvent}
              event={event}
              events={events}
              onEdit={() => onClick(event)}
              isEditMode={isEditMode}
            />
            {event.searchQuery && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick({ ...event, initialView: 'search' });
                }}
              >
                <Search className="h-3 w-3 mr-1" />
                <span className="text-xs">Search</span>
              </Button>
            )}
            {event.rawLog && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick({ ...event, initialView: 'log' });
                }}
              >
                <Terminal className="h-3 w-3 mr-1" />
                <span className="text-xs">Log</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};