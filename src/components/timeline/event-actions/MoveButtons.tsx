import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown } from 'lucide-react';
import type { TimelineEvent } from '@/pages/Index';
import { useToast } from '@/components/ui/use-toast';

interface MoveButtonsProps {
  event: TimelineEvent;
  events: TimelineEvent[];
  onUpdateEvent: (event: TimelineEvent) => void;
}

export const MoveButtons: React.FC<MoveButtonsProps> = ({
  event,
  events,
  onUpdateEvent,
}) => {
  const { toast } = useToast();

  const handleMoveUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Get siblings (events with same parent)
    const siblings = events.filter(e => e.parentId === event.parentId);
    siblings.sort((a, b) => (a.order || 0) - (b.order || 0));
    const currentIndex = siblings.findIndex(e => e.id === event.id);
    
    if (currentIndex <= 0) {
      // If at top of siblings list and has a parent, move up to parent's level
      if (event.parentId) {
        const parentEvent = events.find(e => e.id === event.parentId);
        if (parentEvent?.parentId) {
          // Move to parent's parent
          onUpdateEvent({
            ...event,
            parentId: parentEvent.parentId
          });
          toast({
            title: "Event Moved Up",
            description: "Event moved up to parent level"
          });
        } else {
          // Make it a root event
          onUpdateEvent({
            ...event,
            parentId: undefined
          });
          toast({
            title: "Event Moved Up",
            description: "Event moved to root level"
          });
        }
      }
      return;
    }

    // Get the previous sibling
    const previousSibling = siblings[currentIndex - 1];
    
    // Calculate new orders to ensure correct positioning
    const allSiblings = events.filter(e => e.parentId === event.parentId);
    const maxOrder = Math.max(...allSiblings.map(e => e.order || 0));
    
    // Update orders for both events
    onUpdateEvent({
      ...previousSibling,
      order: maxOrder + 1
    });
    
    onUpdateEvent({
      ...event,
      order: previousSibling.order || 0
    });
    
    toast({
      title: "Event Moved Up",
      description: "Event moved up in the timeline"
    });
  };

  const handleMoveDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Get siblings (events with same parent)
    const siblings = events.filter(e => e.parentId === event.parentId);
    siblings.sort((a, b) => (a.order || 0) - (b.order || 0));
    const currentIndex = siblings.findIndex(e => e.id === event.id);
    
    if (currentIndex === siblings.length - 1) {
      // If at bottom of siblings list, make it a child of previous sibling
      if (currentIndex > 0) {
        const previousSibling = siblings[currentIndex - 1];
        onUpdateEvent({
          ...event,
          parentId: previousSibling.id,
          order: Math.max(...events.filter(e => e.parentId === previousSibling.id).map(e => e.order || 0), 0) + 1
        });
        toast({
          title: "Event Moved Down",
          description: "Event is now a child of the previous sibling"
        });
      }
      return;
    }

    // Get the next sibling
    const nextSibling = siblings[currentIndex + 1];
    
    // Calculate new orders to ensure correct positioning
    const allSiblings = events.filter(e => e.parentId === event.parentId);
    const maxOrder = Math.max(...allSiblings.map(e => e.order || 0));
    
    // Update orders for both events
    onUpdateEvent({
      ...event,
      order: nextSibling.order || 0
    });
    
    onUpdateEvent({
      ...nextSibling,
      order: event.order || 0
    });
    
    toast({
      title: "Event Moved Down",
      description: "Event moved down in the timeline"
    });
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleMoveUp}
        className="h-8 w-8"
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleMoveDown}
        className="h-8 w-8"
      >
        <ArrowDown className="h-4 w-4" />
      </Button>
    </>
  );
};