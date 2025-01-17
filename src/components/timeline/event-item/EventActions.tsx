import { Trash2, Pencil, Plus } from 'lucide-react';
import type { TimelineEvent } from '@/pages/Index';
import { Button } from '@/components/ui/button';

interface EventActionsProps {
  eventId: string;
  onDelete?: (eventId: string) => void;
  onUpdateEvent?: (event: TimelineEvent) => void;
  onAddEvent?: (parentId?: string) => void;
  event: TimelineEvent;
  events: TimelineEvent[];
  onEdit: () => void;
  isEditMode: boolean;
}

export const EventActions: React.FC<EventActionsProps> = ({
  eventId,
  onDelete,
  onUpdateEvent,
  onAddEvent,
  event,
  events,
  onEdit,
  isEditMode,
}) => {
  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddEvent) {
      onAddEvent(eventId);
    }
  };

  if (!isEditMode) {
    return null;
  }

  return (
    <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleAddChild}
        className="text-xs"
      >
        Add Child
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          if (onDelete) onDelete(eventId);
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};