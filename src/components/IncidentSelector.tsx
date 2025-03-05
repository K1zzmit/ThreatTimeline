import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
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
import type { Incident } from '@/lib/types';

interface IncidentSelectorProps {
  incidents: Record<string, Incident>;
  activeIncidentId: string | null;
  onCreateIncident: (name: string, description?: string) => void;
  onSelectIncident: (id: string) => void;
  onDeleteIncident: (id: string) => void;
}

export function IncidentSelector({
  incidents,
  activeIncidentId,
  onCreateIncident,
  onSelectIncident,
  onDeleteIncident,
}: IncidentSelectorProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newIncidentName, setNewIncidentName] = useState('');
  const [newIncidentDescription, setNewIncidentDescription] = useState('');

  const handleCreateIncident = () => {
    if (newIncidentName.trim()) {
      onCreateIncident(newIncidentName.trim(), newIncidentDescription.trim());
      setNewIncidentName('');
      setNewIncidentDescription('');
      setIsCreateDialogOpen(false);
    }
  };

  const handleDeleteIncident = () => {
    if (activeIncidentId) {
      onDeleteIncident(activeIncidentId);
      setIsDeleteDialogOpen(false);
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
          </div>
          <Button onClick={handleCreateIncident}>Create Incident</Button>
        </DialogContent>
      </Dialog>

      {activeIncidentId && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Incident</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this incident? This action cannot be undone.
                All events associated with this incident will be permanently deleted.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteIncident}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 