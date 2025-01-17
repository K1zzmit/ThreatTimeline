import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { ScrollArea } from '../ui/scroll-area';
import { EventItem } from './EventItem';
import type { TimelineEvent } from '@/pages/Index';
import { useTimelineContext } from './TimelineContext';
import { sortEvents } from './timelineUtils';

interface TimelineListProps {
  events: TimelineEvent[];
  onSelectEvent: (event: TimelineEvent) => void;
  onUpdateEvent: (event: TimelineEvent) => void;
  onDeleteEvent?: (eventId: string) => void;
  onAddEvent?: (parentId?: string) => void;
  isLinkingMode?: boolean;
  linkSourceEvent?: TimelineEvent | null;
  isEditMode: boolean;
  collapsedEvents: Set<string>;
  onToggleCollapse: (eventId: string) => void;
}

export const TimelineList: React.FC<TimelineListProps> = ({ 
  events,
  onSelectEvent,
  onUpdateEvent,
  onDeleteEvent,
  onAddEvent,
  isLinkingMode = false,
  linkSourceEvent = null,
  isEditMode,
  collapsedEvents,
  onToggleCollapse
}: TimelineListProps) => {
  const { toast } = useTimelineContext();
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (!isEditMode) return;
    
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const draggedEvent = events.find(e => e.id === active.id);
    const targetEvent = events.find(e => e.id === over.id);

    if (!draggedEvent || !targetEvent) return;

    // Prevent circular references
    let currentParent = targetEvent;
    while (currentParent.parentId) {
      if (currentParent.parentId === draggedEvent.id) {
        toast({
          title: "Invalid Operation",
          description: "Cannot create circular parent-child relationship",
          variant: "destructive",
        });
        return;
      }
      currentParent = events.find(e => e.id === currentParent.parentId) || currentParent;
    }

    // Add animation class
    const updatedEvent = {
      ...draggedEvent,
      parentId: targetEvent.id,
    };

    onUpdateEvent(updatedEvent);
    
    toast({
      title: "Event Updated",
      description: `${draggedEvent.title || 'Event'} is now a child of ${targetEvent.title || 'Event'}`,
    });
  };

  const getEventDepth = (event: TimelineEvent): number => {
    let depth = 0;
    let currentEvent = event;
    
    while (currentEvent.parentId) {
      const parentEvent = events.find(e => e.id === currentEvent.parentId);
      if (!parentEvent) break;
      depth++;
      currentEvent = parentEvent;
    }
    
    return depth;
  };

  // Filter out events that are children of collapsed parents
  const isEventVisible = (event: TimelineEvent): boolean => {
    let currentEvent = event;
    while (currentEvent.parentId) {
      if (collapsedEvents.has(currentEvent.parentId)) {
        return false;
      }
      const parentEvent = events.find(e => e.id === currentEvent.parentId);
      if (!parentEvent) break;
      currentEvent = parentEvent;
    }
    return true;
  };

  // Organize events by their relationships
  const sortedEvents = sortEvents(events);
  const organizedEvents = sortedEvents
    .filter(isEventVisible)
    .map(event => ({
      ...event,
      depth: getEventDepth(event),
    }));

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="p-4 space-y-2">
        {organizedEvents.map((event) => (
          <EventItem
            key={event.id}
            event={event}
            events={events}
            onClick={onSelectEvent}
            onDelete={onDeleteEvent}
            onUpdateEvent={onUpdateEvent}
            onAddEvent={onAddEvent}
            parentEvent={events.find(e => e.id === event.parentId)}
            depth={event.depth}
            isLinkingMode={isLinkingMode}
            isLinkSource={linkSourceEvent?.id === event.id}
            isEditMode={isEditMode}
            isCollapsed={collapsedEvents.has(event.id)}
            onToggleCollapse={onToggleCollapse}
            hasChildren={events.some(e => e.parentId === event.id)}
          />
        ))}
      </div>
    </DndContext>
  );
};

export default TimelineList;