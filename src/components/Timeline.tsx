import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { TimelineProvider } from './timeline/TimelineContext';
import { TimelineList } from './timeline/TimelineList';
import { EventDialog } from './timeline/EventDialog';
import type { TimelineEvent } from '@/pages/Index';
import type { Incident } from '@/lib/incidents';
import { ActionButtons } from './ActionButtons';
import { Button } from './ui/button';
import { Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface TimelineProps {
  events: TimelineEvent[];
  incident?: Incident;
  onAddEvent: (parentId?: string) => string | null;
  onSelectEvent: (event: TimelineEvent) => void;
  onUpdateEvent: (event: TimelineEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  onLateralMovement: (sourceEvent: TimelineEvent, destinationHost: string) => void;
  isEditMode: boolean;
  onEditModeToggle: () => void;
}

export interface TimelineRef {
  selectEvent: (eventId: string) => void;
}

interface DeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  hasChildren: boolean;
}

function DeleteEventDialog({ isOpen, onClose, onConfirm, hasChildren }: DeleteDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Event</DialogTitle>
          <DialogDescription>
            {hasChildren ? (
              <>
                Warning: This event has child events. Deleting it will remove all child events as well.
                This action cannot be undone.
              </>
            ) : (
              "Are you sure you want to delete this event? This action cannot be undone."
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const Timeline = forwardRef<TimelineRef, TimelineProps>(({ 
  events, 
  incident,
  onAddEvent, 
  onSelectEvent, 
  onUpdateEvent,
  onDeleteEvent,
  onLateralMovement,
  isEditMode,
  onEditModeToggle
}, ref) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [isLinkingMode, setIsLinkingMode] = useState(false);
  const [linkSourceEvent, setLinkSourceEvent] = useState<TimelineEvent | null>(null);
  const [collapsedEvents, setCollapsedEvents] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<TimelineEvent | null>(null);

  useImperativeHandle(ref, () => ({
    selectEvent: (eventId: string) => {
      const event = events.find(e => e.id === eventId);
      if (event) {
        if (isDialogOpen) {
          setIsDialogOpen(false);
        }
        setSelectedEvent(event);
        setIsDialogOpen(true);
        onSelectEvent(event);
      }
    }
  }));

  const handleEventClick = (event: TimelineEvent) => {
    setSelectedEvent(event);
    setIsDialogOpen(true);
    onSelectEvent(event);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedEvent(null);
  };

  const handleAddEvent = (parentId?: string) => {
    const newEventId = onAddEvent(parentId);
    if (newEventId) {
      const newEvent = events.find(e => e.id === newEventId);
      if (newEvent) {
        setSelectedEvent(newEvent);
        setIsDialogOpen(true);
      }
    }
  };

  const handleSave = (event: TimelineEvent) => {
    onUpdateEvent(event);
    setIsDialogOpen(false);
    setSelectedEvent(null);
  };

  // Function to check if an event has children
  const hasChildEvents = (eventId: string) => {
    return events.some(event => event.parentId === eventId);
  };

  const handleDeleteClick = (eventId: string) => {
    const eventToDelete = events.find(e => e.id === eventId);
    if (eventToDelete) {
      setEventToDelete(eventToDelete);
      setIsDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = () => {
    if (!eventToDelete) return;

    // Get only direct children
    const directChildren = events.filter(event => event.parentId === eventToDelete.id);
    
    // Delete direct children first
    directChildren.forEach(child => {
      onDeleteEvent(child.id);
    });

    // Then delete the parent
    onDeleteEvent(eventToDelete.id);

    setIsDeleteDialogOpen(false);
    setEventToDelete(null);
  };

  return (
    <TimelineProvider value={{ events, isEditMode, onAddEvent, onUpdateEvent, onDeleteEvent, onLateralMovement }}>
      <Card className="relative">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-2xl font-bold">Timeline</h2>
          <div className="flex items-center gap-2">
            <ActionButtons
              page="timeline"
              events={events}
              incident={incident}
              onEditMode={onEditModeToggle}
              isEditMode={isEditMode}
              onAddEvent={() => handleAddEvent()}
            />
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <TimelineList
            events={events}
            onSelectEvent={handleEventClick}
            onUpdateEvent={onUpdateEvent}
            onDeleteEvent={(eventId: string) => handleDeleteClick(eventId)}
            onAddEvent={handleAddEvent}
            isLinkingMode={isLinkingMode}
            linkSourceEvent={linkSourceEvent}
            isEditMode={isEditMode}
            collapsedEvents={collapsedEvents}
            onToggleCollapse={(eventId) => {
              setCollapsedEvents(prev => {
                const newSet = new Set(prev);
                if (newSet.has(eventId)) {
                  newSet.delete(eventId);
                } else {
                  newSet.add(eventId);
                }
                return newSet;
              });
            }}
          />
        </div>
      </Card>
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        {selectedEvent && (
          <EventDialog
            event={selectedEvent}
            events={events}
            onEventChange={setSelectedEvent}
            onSave={handleSave}
            onLateralMovement={(sourceEvent, destinationHost) => {
              onLateralMovement(sourceEvent, destinationHost);
              setIsDialogOpen(false);
            }}
            isEditMode={isEditMode}
          />
        )}
      </Dialog>
      <DeleteEventDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setEventToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        hasChildren={eventToDelete ? hasChildEvents(eventToDelete.id) : false}
      />
    </TimelineProvider>
  );
});

Timeline.displayName = 'Timeline';

export default Timeline;