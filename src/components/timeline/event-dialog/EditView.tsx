import React from 'react';
import { DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import type { TimelineEvent, Artifact } from '@/pages/Index';
import { EventForm } from './EventForm';
import { EventDetails } from './EventDetails';
import { DialogHeader } from './DialogHeader';

interface EditViewProps {
  event: TimelineEvent;
  events: TimelineEvent[];
  onEventChange: (event: TimelineEvent) => void;
  onSave: () => void;
  showDetails: boolean;
  onToggleDetails: () => void;
  recentArtifacts: { [key: string]: { value: string; linkedValue?: string }[] };
  artifactState: {
    type: Artifact['type'];
    name: string;
    value: string;
    linkedValue: string;
    setType: (type: Artifact['type']) => void;
    setName: (name: string) => void;
    setValue: (value: string) => void;
    setLinkedValue: (value: string) => void;
  };
  handleAddArtifact: () => void;
  handleRemoveArtifact: (index: number) => void;
}

export const EditView: React.FC<EditViewProps> = ({
  event,
  events,
  onEventChange,
  onSave,
  showDetails,
  onToggleDetails,
  recentArtifacts,
  artifactState,
  handleAddArtifact,
  handleRemoveArtifact,
}) => {
  return (
    <DialogContent className="sm:max-w-[900px]">
      <DialogHeader
        showDetails={showDetails}
        onToggleDetails={onToggleDetails}
      />

      {showDetails ? (
        <EventDetails
          event={event}
          onEventChange={onEventChange}
        />
      ) : (
        <EventForm
          event={event}
          events={events}
          onEventChange={onEventChange}
          recentArtifacts={recentArtifacts}
          newArtifactType={artifactState.type}
          newArtifactName={artifactState.name}
          newArtifactValue={artifactState.value}
          newArtifactLinkedValue={artifactState.linkedValue}
          setNewArtifactType={artifactState.setType}
          setNewArtifactName={artifactState.setName}
          setNewArtifactValue={artifactState.setValue}
          setNewArtifactLinkedValue={artifactState.setLinkedValue}
          handleAddArtifact={handleAddArtifact}
          handleRemoveArtifact={handleRemoveArtifact}
          readOnly={false}
        />
      )}

      <DialogFooter>
        <Button onClick={onSave}>Save Changes</Button>
      </DialogFooter>
    </DialogContent>
  );
};