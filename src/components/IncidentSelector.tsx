import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IncidentSettings } from './IncidentSettings';
import type { Incident } from '@/lib/types';
import type { TimelineEvent } from '@/pages/Index';
import { useToast } from '@/components/ui/use-toast';

interface IncidentSelectorProps {
  incidents: Record<string, Incident>;
  activeIncidentId: string | null;
  onCreateIncident: (name: string, description?: string) => string;
  onSelectIncident: (id: string) => void;
  onDeleteIncident: (id: string) => void;
  onRenameIncident: (id: string, name: string) => void;
  onImportIncident: (data: { incident: Incident; events: TimelineEvent[] }) => void;
  events?: TimelineEvent[];
}

export function IncidentSelector({
  incidents,
  activeIncidentId,
  onCreateIncident,
  onSelectIncident,
  onDeleteIncident,
  onRenameIncident,
  onImportIncident,
  events = [],
}: IncidentSelectorProps) {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newIncidentName, setNewIncidentName] = useState('');
  const [newIncidentDescription, setNewIncidentDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateIncident = () => {
    if (newIncidentName.trim()) {
      onCreateIncident(newIncidentName.trim(), newIncidentDescription.trim());
      setNewIncidentName('');
      setNewIncidentDescription('');
      setIsCreateDialogOpen(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (activeIncidentId) {
      onDeleteIncident(activeIncidentId);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        console.log('Importing data:', data); // For debugging
        
        // Check if the data has the correct structure
        if (!data.incident) {
          throw new Error('Invalid file format: missing incident data');
        }

        // Get events from either location
        const eventsFromIncident = data.incident.events || [];
        const eventsFromRoot = data.events || [];
        const combinedEvents = eventsFromRoot.length > 0 ? eventsFromRoot : eventsFromIncident;

        const importData = {
          incident: {
            ...data.incident,
            events: combinedEvents
          },
          events: combinedEvents
        };

        onImportIncident(importData);
        setIsCreateDialogOpen(false);
        
        toast({
          title: "Incident Imported",
          description: `Successfully imported incident: ${data.incident.name} with ${combinedEvents.length} events`,
        });
      } catch (error) {
        console.error('Error importing incident:', error);
        toast({
          title: "Import Failed",
          description: error instanceof Error ? error.message : "Failed to import incident. Please check the file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={activeIncidentId || ''}
        onValueChange={onSelectIncident}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select an incident" />
        </SelectTrigger>
        <SelectContent>
          {Object.values(incidents).map((incident) => (
            <SelectItem key={incident.id} value={incident.id}>
              {incident.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" data-create-incident-trigger>
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Incident</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newIncidentName}
                onChange={(e) => setNewIncidentName(e.target.value)}
                placeholder="Enter incident name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newIncidentDescription}
                onChange={(e) => setNewIncidentDescription(e.target.value)}
                placeholder="Enter incident description"
              />
            </div>
            <div className="grid gap-2">
              <Label>Import Incident</Label>
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImport}
                  accept=".json"
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import from File
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateIncident}>Create Incident</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {activeIncidentId && (
        <>
          <IncidentSettings
            incident={incidents[activeIncidentId]}
            events={events}
            onRename={(name) => onRenameIncident(activeIncidentId, name)}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleDeleteClick}
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Incident</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this incident? This action cannot be undone.
                  All events associated with this incident will be permanently deleted.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteConfirm}>
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
} 