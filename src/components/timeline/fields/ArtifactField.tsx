import React from 'react';
import type { Artifact } from '@/pages/Index';
import { ArtifactForm } from './ArtifactForm';
import { Button } from '@/components/ui/button';
import { Pencil, Plus } from 'lucide-react';

interface ArtifactFieldProps {
  artifactType: Artifact['type'];
  artifactName: string;
  artifactValue: string;
  artifactLinkedValue: string;
  onTypeChange: (value: Artifact['type']) => void;
  onNameChange: (value: string) => void;
  onValueChange: (value: string) => void;
  onLinkedValueChange: (value: string) => void;
  onAdd: () => void;
  recentArtifacts: {
    [key: string]: { value: string; linkedValue?: string }[];
  };
  onBulkAdd?: (entries: string[]) => void;
  onResetSuggestions: () => void;
}

export const ArtifactField: React.FC<ArtifactFieldProps> = (props) => {
  return <ArtifactForm {...props} />;
};