import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings2, Download, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { Incident } from '@/lib/types';
import type { TimelineEvent } from '@/pages/Index';

interface IncidentSettingsProps {
  incident: Incident;
  events: TimelineEvent[];
  onRename: (name: string) => void;
}

export function IncidentSettings({ incident, events, onRename }: IncidentSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState(incident.name);

  const handleExport = () => {
    console.log('Current incident:', incident);
    console.log('Current events:', events);
    
    // Create the export data structure
    const exportData = {
      incident: {
        ...incident,
        events: events // Include all events in the incident object
      },
      events: events  // Also include at root level for backwards compatibility
    };

    console.log('Exporting data:', exportData); // For debugging

    // Create and trigger the download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${incident.name.replace(/\s+/g, '_')}_export.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    if (newName.trim() && newName !== incident.name) {
      onRename(newName.trim());
      setIsOpen(false);
    }
  };

  // Reset the name state when the incident changes
  React.useEffect(() => {
    setNewName(incident.name);
  }, [incident.name]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Incident Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Incident Name</Label>
            <Input
              id="name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter incident name"
            />
          </div>
          <div className="grid gap-2">
            <Label>Export/Import</Label>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Incident
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 