import React, { useState, useEffect } from 'react';
import {
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import type { TimelineEvent, Artifact } from '@/pages/Index';
import { EventForm } from './event-dialog/EventForm';
import { EventDetails } from './event-dialog/EventDetails';
import { DialogHeader } from './event-dialog/DialogHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Editor from '@monaco-editor/react';
import { Copy, RotateCcw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Configure Monaco Editor for Splunk SPL syntax
import { loader } from '@monaco-editor/react';

loader.init().then(monaco => {
  monaco.languages.register({ id: 'splunk' });
  monaco.languages.setMonarchTokensProvider('splunk', {
    tokenizer: {
      root: [
        [/\|/, 'pipe'],
        [/\b(search|where|eval|stats|rename|rex|table|dedup|sort|top|rare|timechart|transaction|join|lookup)\b/, 'command'],
        [/\b(sourcetype|source|index|host)\s*=/, 'argument'],
        [/"[^"]*"|'[^']*'/, 'string'],
        [/\b[a-zA-Z0-9_]+\s*=/, 'field'],
        [/=|!=|<|>|<=|>=|AND|OR|NOT/, 'keyword'],
        [/\b\d+\b/, 'number'],
      ]
    }
  });

  monaco.editor.defineTheme('splunk-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'pipe', foreground: 'd4d4d4', fontStyle: 'bold' },
      { token: 'command', foreground: '569cd6', fontStyle: 'bold' },
      { token: 'argument', foreground: '3dc9b0' },
      { token: 'string', foreground: 'ce9178' },
      { token: 'field', foreground: '9cdcfe' },
      { token: 'keyword', foreground: 'dd6a6f' },
      { token: 'number', foreground: 'b5cea8' },
    ],
    colors: {
      'editor.background': '#0a0d17',
      'editor.foreground': '#d4d4d4',
    }
  });
});

interface EventDialogProps {
  event: TimelineEvent | null;
  events: TimelineEvent[];
  onEventChange: (event: TimelineEvent) => void;
  onSave: (event: TimelineEvent) => void;
  onLateralMovement: (sourceEvent: TimelineEvent, destinationHost: string) => void;
  isEditMode: boolean;
}

export const EventDialog: React.FC<EventDialogProps> = ({
  event,
  events,
  onEventChange,
  onSave,
  onLateralMovement,
  isEditMode,
}) => {
  const { toast } = useToast();
  const [newArtifactType, setNewArtifactType] = useState<Artifact['type']>('custom');
  const [newArtifactName, setNewArtifactName] = useState('');
  const [newArtifactValue, setNewArtifactValue] = useState('');
  const [newArtifactLinkedValue, setNewArtifactLinkedValue] = useState('');
  const [currentEvent, setCurrentEvent] = useState<TimelineEvent | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Reset currentEvent whenever event prop changes
  useEffect(() => {
    if (!event) return;
    // Create a clean copy of the event
    const eventCopy = JSON.parse(JSON.stringify(event));
    setCurrentEvent(eventCopy);
  }, [event]);

  if (!event || !currentEvent) return null;

  const recentArtifacts = showSuggestions ? events.reduce((acc, evt) => {
    evt.artifacts?.forEach(artifact => {
      if (!acc[artifact.type]) {
        acc[artifact.type] = [];
      }
      const existingArtifact = acc[artifact.type].find(a => 
        a.value === artifact.value && a.name === artifact.name
      );
      if (!existingArtifact) {
        acc[artifact.type].push({
          name: artifact.name,
          value: artifact.value,
          linkedValue: artifact.linkedValue,
        });
      }
    });
    return acc;
  }, {} as { [key: string]: { name: string; value: string; linkedValue?: string }[] }) : {};

  const handleAddArtifact = () => {
    if (!newArtifactName || !newArtifactValue) return;

    const newArtifact: Artifact = {
      type: newArtifactType,
      name: newArtifactName,
      value: newArtifactValue,
      linkedValue: newArtifactLinkedValue || undefined,
    };

    const updatedEvent = {
      ...currentEvent,
      artifacts: [...(currentEvent.artifacts || []), newArtifact],
    };
    setCurrentEvent(updatedEvent);
    onEventChange(updatedEvent);

    setNewArtifactType('custom');
    setNewArtifactName('');
    setNewArtifactValue('');
    setNewArtifactLinkedValue('');
  };

  const handleRemoveArtifact = (index: number) => {
    const updatedEvent = {
      ...currentEvent,
      artifacts: currentEvent.artifacts.filter((_, i) => i !== index),
    };
    setCurrentEvent(updatedEvent);
    onEventChange(updatedEvent);
  };

  const handleEventChange = (updates: Partial<TimelineEvent>) => {
    if (!currentEvent) return;
    const updatedEvent = {
      ...currentEvent,
      ...updates,
    };
    setCurrentEvent(updatedEvent);
    onEventChange(updatedEvent);
  };

  const handleSave = () => {
    if (!currentEvent) return;
    onSave(currentEvent);
  };

  const handleResetRecentArtifacts = () => {
    setShowSuggestions(false);
    
    toast({
      title: "Recent artifacts cleared",
      description: "All saved artifact suggestions have been reset.",
    });
  };

  return (
    <DialogContent className="max-h-[90vh] overflow-hidden flex flex-col sm:max-w-[900px]">
      <DialogHeader>
        <h2 className="text-lg font-semibold">Edit Event</h2>
        <p className="text-sm text-muted-foreground">
          Add or modify event details and artifacts
        </p>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto pr-2">
        <Tabs 
          defaultValue={currentEvent.initialView || "details"} 
          key={currentEvent.id}
          onValueChange={(value) => setActiveTab(value)}
        >
          <div className="flex items-center justify-between mb-2">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="search">Search Query</TabsTrigger>
              <TabsTrigger value="log">Raw Log</TabsTrigger>
            </TabsList>
            {activeTab === 'search' && (
              <Button
                variant="secondary"
                size="sm"
                className="h-7"
                onClick={() => {
                  navigator.clipboard.writeText(currentEvent.searchQuery || '');
                  toast({
                    title: "Copied to clipboard",
                    description: "Search query has been copied to your clipboard.",
                  });
                }}
              >
                <Copy className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs">Copy</span>
              </Button>
            )}
          </div>
          <TabsContent value="details">
            <EventForm
              event={currentEvent}
              events={events}
              onEventChange={handleEventChange}
              recentArtifacts={recentArtifacts}
              newArtifactType={newArtifactType}
              newArtifactName={newArtifactName}
              newArtifactValue={newArtifactValue}
              newArtifactLinkedValue={newArtifactLinkedValue}
              setNewArtifactType={setNewArtifactType}
              setNewArtifactName={setNewArtifactName}
              setNewArtifactValue={setNewArtifactValue}
              setNewArtifactLinkedValue={setNewArtifactLinkedValue}
              handleAddArtifact={handleAddArtifact}
              handleRemoveArtifact={handleRemoveArtifact}
              onLateralMovement={onLateralMovement}
              readOnly={!isEditMode}
              isEditMode={isEditMode}
              handleSubmit={handleSave}
              onResetSuggestions={() => setShowSuggestions(false)}
            />
          </TabsContent>
          <TabsContent value="search" className="space-y-4">
            <div className="overflow-hidden rounded-md bg-[#0a0d17]">
              <Editor
                height="150px"
                defaultLanguage="splunk"
                value={currentEvent.searchQuery || ''}
                onChange={(value) => handleEventChange({ searchQuery: value || '' })}
                theme="splunk-dark"
                options={{
                  readOnly: !isEditMode,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  lineNumbers: 'off',
                  glyphMargin: false,
                  folding: false,
                  lineDecorationsWidth: 0,
                  lineNumbersMinChars: 0,
                  renderValidationDecorations: 'off',
                  scrollbar: {
                    vertical: 'hidden',
                    horizontal: 'hidden'
                  },
                  wordWrap: 'on',
                  wrappingStrategy: 'advanced'
                }}
              />
            </div>
          </TabsContent>
          <TabsContent value="log" className="space-y-4">
            <div className="overflow-hidden rounded-md bg-[#0a0d17]">
              <Editor
                height="150px"
                defaultLanguage="plaintext"
                value={currentEvent.rawLog || ''}
                onChange={(value) => handleEventChange({ rawLog: value || '' })}
                theme="vs-dark"
                options={{
                  readOnly: !isEditMode,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  lineNumbers: 'off',
                  glyphMargin: false,
                  folding: false,
                  lineDecorationsWidth: 0,
                  lineNumbersMinChars: 0,
                  renderValidationDecorations: 'off',
                  scrollbar: {
                    vertical: 'hidden',
                    horizontal: 'hidden'
                  },
                  wordWrap: 'on',
                  wrappingStrategy: 'advanced'
                }}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <DialogFooter>
        <Button onClick={handleSave} disabled={!isEditMode}>
          Save Changes
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};