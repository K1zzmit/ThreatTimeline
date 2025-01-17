import React, { useState } from 'react';
import type { TimelineEvent, Artifact } from '@/pages/Index';
import { ReadOnlyView } from './ReadOnlyView';
import { EditView } from './EditView';

interface EventDialogProps {
  event: TimelineEvent | null;
  events: TimelineEvent[];
  onEventChange: (event: TimelineEvent) => void;
  onSave: () => void;
  isEditMode: boolean;
}

export const EventDialog: React.FC<EventDialogProps> = ({
  event,
  events,
  onEventChange,
  onSave,
  isEditMode,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [newArtifactType, setNewArtifactType] = useState<Artifact['type']>('custom');
  const [newArtifactName, setNewArtifactName] = useState('');
  const [newArtifactValue, setNewArtifactValue] = useState('');
  const [newArtifactLinkedValue, setNewArtifactLinkedValue] = useState('');

  if (!event) return null;

  const recentArtifacts = events.reduce((acc, evt) => {
    evt.artifacts?.forEach(artifact => {
      if (!acc[artifact.type]) {
        acc[artifact.type] = [];
      }
      const existingArtifact = acc[artifact.type].find(a => a.value === artifact.value);
      if (!existingArtifact) {
        acc[artifact.type].push({
          value: artifact.value,
          linkedValue: artifact.linkedValue,
        });
      }
    });
    return acc;
  }, {} as { [key: string]: { value: string; linkedValue?: string }[] });

  const handleAddArtifact = () => {
    if (!newArtifactName || !newArtifactValue) return;

    const newArtifact: Artifact = {
      type: newArtifactType,
      name: newArtifactName,
      value: newArtifactValue,
      linkedValue: newArtifactLinkedValue || undefined,
    };

    onEventChange({
      ...event,
      artifacts: [...(event.artifacts || []), newArtifact],
    });

    setNewArtifactType('custom');
    setNewArtifactName('');
    setNewArtifactValue('');
    setNewArtifactLinkedValue('');
  };

  const handleRemoveArtifact = (index: number) => {
    onEventChange({
      ...event,
      artifacts: event.artifacts.filter((_, i) => i !== index),
    });
  };

  if (!isEditMode) {
    return (
      <ReadOnlyView
        event={event}
        events={events}
        recentArtifacts={recentArtifacts}
      />
    );
  }

  return (
    <EditView
      event={event}
      events={events}
      onEventChange={onEventChange}
      onSave={onSave}
      showDetails={showDetails}
      onToggleDetails={() => setShowDetails(!showDetails)}
      recentArtifacts={recentArtifacts}
      artifactState={{
        type: newArtifactType,
        name: newArtifactName,
        value: newArtifactValue,
        linkedValue: newArtifactLinkedValue,
        setType: setNewArtifactType,
        setName: setNewArtifactName,
        setValue: setNewArtifactValue,
        setLinkedValue: setNewArtifactLinkedValue,
      }}
      handleAddArtifact={handleAddArtifact}
      handleRemoveArtifact={handleRemoveArtifact}
    />
  );
};