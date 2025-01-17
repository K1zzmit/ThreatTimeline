import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import type { Artifact } from '@/pages/Index';
import { ArtifactField } from '../../fields/ArtifactField';
import { Pencil } from 'lucide-react';

interface ArtifactSectionProps {
  artifacts?: Artifact[];
  recentArtifacts: { 
    [key: string]: { 
      name: string;
      value: string; 
      linkedValue?: string 
    }[] 
  };
  newArtifactType: Artifact['type'];
  newArtifactName: string;
  newArtifactValue: string;
  newArtifactLinkedValue: string;
  setNewArtifactType: (type: Artifact['type']) => void;
  setNewArtifactName: (name: string) => void;
  setNewArtifactValue: (value: string) => void;
  setNewArtifactLinkedValue: (value: string) => void;
  handleAddArtifact: () => void;
  handleRemoveArtifact: (index: number) => void;
  readOnly?: boolean;
  onArtifactsChange: (artifacts: Artifact[]) => void;
  onResetSuggestions: () => void;
}

export const ArtifactSection: React.FC<ArtifactSectionProps> = ({
  artifacts = [],
  recentArtifacts,
  newArtifactType,
  newArtifactName,
  newArtifactValue,
  newArtifactLinkedValue,
  setNewArtifactType,
  setNewArtifactName,
  setNewArtifactValue,
  setNewArtifactLinkedValue,
  handleAddArtifact,
  handleRemoveArtifact,
  readOnly = false,
  onArtifactsChange,
  onResetSuggestions,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleEdit = (index: number, artifact: Artifact) => {
    setEditingIndex(index);
    setNewArtifactType(artifact.type);
    setNewArtifactName(artifact.name);
    setNewArtifactValue(artifact.value);
    setNewArtifactLinkedValue(artifact.linkedValue || '');
  };

  const handleUpdate = () => {
    if (editingIndex === null || !artifacts) {
      return;
    }
    
    try {
      const updatedArtifacts = [...artifacts];
      updatedArtifacts[editingIndex] = {
        type: newArtifactType,
        name: newArtifactName,
        value: newArtifactValue,
        linkedValue: newArtifactLinkedValue || undefined,
      };
      
      onArtifactsChange(updatedArtifacts);
      
      // Reset form and editing state
      setEditingIndex(null);
      setNewArtifactType('custom');
      setNewArtifactName('');
      setNewArtifactValue('');
      setNewArtifactLinkedValue('');
    } catch (error) {
      console.error('❌ Error updating artifact:', error);
    }
  };

  const handleArtifactUpdate = (index: number, field: keyof Artifact, value: string) => {
    const updatedArtifacts = [...artifacts];
    updatedArtifacts[index] = {
      ...updatedArtifacts[index],
      [field]: value
    };
    onArtifactsChange(updatedArtifacts);
  };

  const handleBulkAdd = (entries: string[]) => {
    if (!artifacts) return;

    const newArtifacts = entries.map(entry => ({
      type: newArtifactType,
      name: newArtifactName,
      value: entry.trim(),
      linkedValue: newArtifactLinkedValue || undefined,
    }));

    onArtifactsChange([...artifacts, ...newArtifacts]);

    // Reset form
    setNewArtifactValue('');
    setNewArtifactLinkedValue('');
  };

  return (
    <div className="space-y-4">
      <Label>Artifacts</Label>
      <div className="grid gap-4">
        {artifacts?.map((artifact, index) => (
          <div key={index} className="flex items-center gap-2 p-2 border rounded">
            <div className="flex-1">
              <div className="font-medium">{artifact.name}</div>
              <div className="text-sm text-muted-foreground">
                {artifact.value}
                {artifact.linkedValue && ` (${artifact.linkedValue})`}
              </div>
            </div>
            {!readOnly && (
              <div className="flex gap-2">
                <button
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => handleEdit(index, artifact)}
                  type="button"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => handleRemoveArtifact(index)}
                  type="button"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {!readOnly && (
        <ArtifactField
          artifactType={newArtifactType}
          artifactName={newArtifactName}
          artifactValue={newArtifactValue}
          artifactLinkedValue={newArtifactLinkedValue}
          onTypeChange={setNewArtifactType}
          onNameChange={setNewArtifactName}
          onValueChange={setNewArtifactValue}
          onLinkedValueChange={setNewArtifactLinkedValue}
          onAdd={editingIndex !== null ? handleUpdate : handleAddArtifact}
          recentArtifacts={recentArtifacts}
          onBulkAdd={handleBulkAdd}
          onResetSuggestions={onResetSuggestions}
        />
      )}
    </div>
  );
};