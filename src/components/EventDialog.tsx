import React, { useState, useEffect } from 'react';
import {
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import type { TimelineEvent, Artifact } from '@/pages/Index';
import { EventForm } from '@/components/timeline/event-dialog/EventForm';
import { EventDetails } from '@/components/timeline/event-dialog/EventDetails';
import { DialogHeader } from '@/components/timeline/event-dialog/DialogHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Editor, { loader } from '@monaco-editor/react';
import { Copy, RotateCcw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Configure Monaco Editor for Splunk SPL syntax
loader.init().then(monaco => {
  monaco.languages.register({ id: 'splunk' });
  monaco.languages.setMonarchTokensProvider('splunk', {
    defaultToken: '',
    ignoreCase: true,
    tokenizer: {
      root: [
        // Basic commands - blue
        [/\b(search|stats|where|eval|rename|table|dedup|sort|fields)\b/, 'command'],
        
        // Functions - green
        [/\b(count|values|sum|avg|min|max|list|dc|earliest|latest)\b/, 'function'],
        
        // Keywords - purple
        [/\b(by|as|in|not|and|or|where)\b/, 'keyword'],
        
        // Fields - light blue
        [/\b[a-zA-Z0-9_]+(?=\s*[=]|$|\s+(?:as|by|in)|\s*\(|\s*,)/, 'field'],
        
        // Strings - orange
        [/"[^"]*"/, 'string'],
        [/'[^']*'/, 'string'],
        
        // Operators - red
        [/[=<>!]=?|[\+\-\*\/\%]|\b(?:AND|OR|NOT)\b/, 'operator'],
        
        // Delimiters - white
        [/[\(\),]/, 'delimiter'],
        
        // Pipes - white
        [/\|/, 'pipe']
      ]
    }
  });

  monaco.editor.defineTheme('splunk-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'command', foreground: '6B98FF', fontStyle: 'bold' },     // Bright blue
      { token: 'function', foreground: '98C379', fontStyle: 'bold' },    // Green
      { token: 'keyword', foreground: 'C586C0', fontStyle: 'bold' },     // Purple
      { token: 'field', foreground: '4FC1FF' },                          // Light blue
      { token: 'string', foreground: 'CE9178' },                         // Orange
      { token: 'operator', foreground: 'FF6B6B' },                       // Red
      { token: 'delimiter', foreground: 'D4D4D4' },                      // White
      { token: 'pipe', foreground: 'D4D4D4', fontStyle: 'bold' }        // White bold
    ],
    colors: {
      'editor.background': '#1E1E1E',
      'editor.foreground': '#D4D4D4'
    }
  });
}); 

interface EventDialogProps {
  event?: TimelineEvent;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: TimelineEvent) => void;
}

export function EventDialog({ event, isOpen, onClose, onSubmit }: EventDialogProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState(event?.searchQuery || '');
  const [rawLog, setRawLog] = useState(event?.rawLog || '');
  
  useEffect(() => {
    if (event) {
      setSearchQuery(event.searchQuery || '');
      setRawLog(event.rawLog || '');
    }
  }, [event]);

  return (
    <DialogContent className="max-w-4xl">
      <DialogHeader>
        <h2 className="text-lg font-semibold">Edit Event</h2>
        <p className="text-sm text-muted-foreground">Add or modify event details and artifacts</p>
      </DialogHeader>
      
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="search">Search Query</TabsTrigger>
          <TabsTrigger value="raw">Raw Log</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <EventForm 
            event={event || { 
              id: '', 
              timestamp: new Date().toISOString(), 
              artifacts: [],
              title: '',
              description: '',
              tactic: '',
              technique: ''
            }}
            events={[]}
            onEventChange={onSubmit}
            recentArtifacts={{}}
            newArtifactType="file"
            newArtifactName=""
            newArtifactValue=""
            newArtifactLinkedValue=""
            setNewArtifactType={() => {}}
            setNewArtifactName={() => {}}
            setNewArtifactValue={() => {}}
            setNewArtifactLinkedValue={() => {}}
            handleAddArtifact={() => {}}
            handleRemoveArtifact={() => {}}
            onLateralMovement={() => {}}
            isEditMode={true}
            handleSubmit={() => onSubmit({ 
              id: '', 
              timestamp: new Date().toISOString(), 
              artifacts: [],
              title: '',
              description: '',
              tactic: '',
              technique: ''
            })}
            onResetSuggestions={() => {}}
          />
        </TabsContent>
        
        <TabsContent value="search" className="min-h-[400px]">
          <div className="flex flex-col gap-4">
            <Editor
              height="300px"
              language="splunk"
              defaultLanguage="splunk"
              theme="splunk-dark"
              value={searchQuery}
              onChange={(value) => setSearchQuery(value || '')}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                lineNumbers: 'on',
                renderLineHighlight: 'all',
                automaticLayout: true,
              }}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Clear
              </Button>
              <Button variant="outline" onClick={() => {
                navigator.clipboard.writeText(searchQuery);
                toast({ description: "Search query copied to clipboard" });
              }}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </DialogFooter>
          </div>
        </TabsContent>
        
        <TabsContent value="raw" className="min-h-[400px]">
          <div className="flex flex-col gap-4">
            <Editor
              height="300px"
              defaultLanguage="plaintext"
              theme="vs-dark"
              value={rawLog}
              onChange={(value) => setRawLog(value || '')}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                lineNumbers: 'on',
                renderLineHighlight: 'all',
                automaticLayout: true,
                wordWrap: 'on'
              }}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setRawLog('')}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Clear
              </Button>
              <Button variant="outline" onClick={() => {
                navigator.clipboard.writeText(rawLog);
                toast({ description: "Raw log copied to clipboard" });
              }}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </DialogFooter>
          </div>
        </TabsContent>
      </Tabs>
    </DialogContent>
  );
} 