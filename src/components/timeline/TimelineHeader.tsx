import { Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { useTimelineContext } from './TimelineContext';

interface TimelineHeaderProps {
  onAddEvent: () => void;
  isEditMode: boolean;
}

export const TimelineHeader = ({ onAddEvent, isEditMode }: TimelineHeaderProps) => {
  return (
    <div className="p-4 border-b flex items-center justify-between">
      <h2 className="text-lg font-semibold">Timeline</h2>
    </div>
  );
};