import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, RotateCcw } from 'lucide-react';
import type { Artifact } from '@/pages/Index';
import { ArtifactValueInput } from './ArtifactValueInput';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ArtifactFormProps {
  artifactType: Artifact['type'];
  artifactName: string;
  artifactValue: string;
  artifactLinkedValue: string;
  onTypeChange: (value: Artifact['type']) => void;
  onNameChange: (value: string) => void;
  onValueChange: (value: string) => void;
  onLinkedValueChange: (value: string) => void;
  onAdd: (artifact: Artifact) => void;
  recentArtifacts: {
    [key: string]: { value: string; linkedValue?: string }[];
  };
  isEditing?: boolean;
  onEdit?: () => void;
  onBulkAdd?: (entries: string[]) => void;
  onResetSuggestions: () => void;
}

export const ArtifactForm: React.FC<ArtifactFormProps> = ({
  artifactType,
  artifactName,
  artifactValue,
  artifactLinkedValue,
  onTypeChange,
  onNameChange,
  onValueChange,
  onLinkedValueChange,
  onAdd,
  recentArtifacts,
  isEditing = false,
  onEdit,
  onBulkAdd,
  onResetSuggestions,
}) => {
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkInput, setBulkInput] = useState('');

  const showLinkedValue = artifactType === 'hostname' || 
                         artifactType === 'domain' || 
                         artifactType === 'file' ||
                         artifactType === 'user';

  // Handle value selection and automatically set linked value if it exists
  const handleValueChange = (newValue: string) => {
    onValueChange(newValue);
    
    // Find matching recent artifact and set its linked value if it exists
    const matchingArtifact = recentArtifacts[artifactType]?.find(
      artifact => artifact.value === newValue
    );
    
    if (matchingArtifact?.linkedValue) {
      onLinkedValueChange(matchingArtifact.linkedValue);
    }
  };

  // Handle bulk artifact addition
  const handleBulkAdd = () => {
    const entries = bulkInput.split('\n').filter(entry => entry.trim());
    if (onBulkAdd) {
      onBulkAdd(entries);
      setBulkInput('');
    }
  };

  // Get recent names for the name input
  const recentNames = React.useMemo(() => {
    const names = new Set<string>();
    Object.values(recentArtifacts).forEach(artifacts => {
      artifacts.forEach(a => names.add(a.name));
    });
    return Array.from(names);
  }, [recentArtifacts]);

  // Get recent linked values for the current type
  const recentLinkedValues = React.useMemo(() => {
    return recentArtifacts[artifactType]?.map(a => a.linkedValue).filter(Boolean) || [];
  }, [recentArtifacts, artifactType]);

  // Prevent event propagation for all reset buttons
  const handleResetClick = (e: React.MouseEvent, resetFn: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    resetFn();
    onResetSuggestions();
  };

  const handleAddArtifact = () => {
    if (!artifactName || !artifactValue) return;

    const newArtifact: Artifact = {
      type: artifactType,
      name: artifactType === 'command' ? artifactName : artifactName,
      value: artifactType === 'command' ? artifactValue : artifactValue,
      linkedValue: artifactLinkedValue || undefined,
    };

    onAdd(newArtifact);

    // Reset form
    setNewArtifactType('custom');
    setNewArtifactName('');
    setNewArtifactValue('');
    setNewArtifactLinkedValue('');
  };

  return (
    <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
      <div className="grid grid-cols-2 gap-2">
        <Select value={artifactType} onValueChange={onTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hostname">Hostname</SelectItem>
            <SelectItem value="domain">Domain</SelectItem>
            <SelectItem value="file">File</SelectItem>
            <SelectItem value="ip">IP</SelectItem>
            <SelectItem value="hash">Hash</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="command">Command</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <ArtifactValueInput
            type="name"
            value={artifactName}
            onChange={onNameChange}
            recentValues={recentNames}
            placeholder={artifactType === 'command' ? 'Binary Name' : 'Enter value...'}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => handleResetClick(e, () => onNameChange(''))}
            title="Reset name"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={isBulkMode}
          onCheckedChange={setIsBulkMode}
        />
        <Label>Bulk Input Mode</Label>
      </div>

      {isBulkMode ? (
        <>
          <Textarea
            placeholder="Enter multiple values (one per line)"
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            rows={5}
          />
          <Button 
            onClick={handleBulkAdd}
            type="button" 
            className="w-full"
            disabled={!artifactName || !bulkInput.trim()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Multiple Artifacts
          </Button>
        </>
      ) : (
        <>
          <div className="flex gap-1">
            <ArtifactValueInput
              type={artifactType}
              value={artifactValue}
              onChange={handleValueChange}
              recentValues={recentArtifacts[artifactType]?.map(a => a.value) || []}
              placeholder={artifactType === 'command' ? 'Enter Command...' : 'Enter value...'}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => handleResetClick(e, () => onValueChange(''))}
              title="Reset value"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {showLinkedValue && (
            <div className="flex gap-1">
              <ArtifactValueInput
                type={`${artifactType}-linked`}
                value={artifactLinkedValue}
                onChange={onLinkedValueChange}
                recentValues={recentLinkedValues}
                placeholder={
                  artifactType === 'file'
                    ? 'File Hash'
                    : artifactType === 'user'
                      ? 'Domain'
                      : 'IP Address'
                }
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleResetClick(e, () => onLinkedValueChange(''))}
                title="Reset value"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Button 
            onClick={isEditing ? onEdit : handleAddArtifact}
            type="button" 
            className="w-full"
            disabled={!artifactName || !artifactValue}
          >
            {isEditing ? (
              <>
                <span className="w-4 h-4 mr-2">✏️</span>
                Update Artifact
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Artifact
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
};