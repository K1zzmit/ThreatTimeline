import { createContext, useContext } from 'react';
import type { TimelineEvent } from '@/pages/Index';

interface TimelineContextType {
  events: TimelineEvent[];
  isEditMode: boolean;
  onAddEvent: (parentId?: string) => string | null;
  onUpdateEvent: (event: TimelineEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  onLateralMovement: (sourceEvent: TimelineEvent, destinationHost: string) => void;
}

const TimelineContext = createContext<TimelineContextType | undefined>(undefined);

interface TimelineProviderProps {
  children: React.ReactNode;
  value: TimelineContextType;
}

export const TimelineProvider = ({ children, value }: TimelineProviderProps) => {
  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>
  );
};

export const useTimelineContext = () => {
  const context = useContext(TimelineContext);
  if (!context) {
    throw new Error('useTimelineContext must be used within a TimelineProvider');
  }
  return context;
};