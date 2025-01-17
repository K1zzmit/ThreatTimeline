import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { TimelineEvent } from '@/pages/Index';
import Editor, { loader } from '@monaco-editor/react';
import { Button } from '@/components/ui/button';

// Pre-configure Monaco
loader.init().then(monaco => {
  monaco.languages.register({ id: 'splunk' });
  monaco.languages.setMonarchTokensProvider('splunk', {
    defaultToken: '',
    ignoreCase: true,
    tokenizer: {
      root: [
        // Basic commands - blue
        [/\b(search|stats|where|eval|rename|table|dedup|sort|fields)\b/, 'command'],
        
        // Functions - purple
        [/\b(count|values|sum|avg|min|max|list|dc|earliest|latest)\b/, 'function'],
        
        // Keywords - orange
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
      { token: 'function', foreground: 'C586C0', fontStyle: 'bold' },    // Purple
      { token: 'keyword', foreground: 'CE9178', fontStyle: 'bold' },     // Orange
      { token: 'field', foreground: '4FC1FF' },                          // Light blue
      { token: 'string', foreground: 'CE9178' },                         // Orange
      { token: 'operator', foreground: 'FF6B6B' },                       // Red
      { token: 'delimiter', foreground: 'D4D4D4' },                      // White
      { token: 'pipe', foreground: 'D4D4D4', fontStyle: 'bold' }        // White bold
    ],
    colors: {
      'editor.background': '#0a0d17',
      'editor.foreground': '#d4d4d4',
    }
  });
});

interface EventDetailsProps {
  event: TimelineEvent;
  onEventChange: (event: TimelineEvent) => void;
  onSave: () => void;
  isEditMode: boolean;
}

export const EventDetails: React.FC<EventDetailsProps> = ({
  event,
  onEventChange,
  onSave,
  isEditMode,
}) => {
  const [editorHeight, setEditorHeight] = useState("72px");

  useEffect(() => {
    if (event.searchQuery) {
      const lineCount = event.searchQuery.split('\n').length;
      const newHeight = Math.max(72, lineCount * 24);
      setEditorHeight(`${newHeight}px`);
    } else {
      setEditorHeight("72px");
    }
  }, [event.searchQuery]);

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="searchQuery">Search Query Used</Label>
        <div className="overflow-hidden rounded-md bg-[#0a0d17]">
          <Editor
            height={editorHeight}
            defaultLanguage="splunk"
            value={event.searchQuery || ''}
            onChange={(value) => {
              onEventChange({ ...event, searchQuery: value || '' });
              if (value) {
                const lineCount = value.split('\n').length;
                const newHeight = Math.max(72, lineCount * 24);
                setEditorHeight(`${newHeight}px`);
              }
            }}
            theme="splunk-dark"
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              lineNumbers: 'off',
              glyphMargin: false,
              folding: false,
              lineDecorationsWidth: 0,
              lineNumbersMinChars: 0,
              automaticLayout: true,
              scrollbar: {
                vertical: 'hidden',
                horizontal: 'hidden'
              },
              renderValidationDecorations: 'off',
              wordWrap: 'on',
              wrappingStrategy: 'advanced'
            }}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="rawLog">Raw Log</Label>
        <Textarea
          id="rawLog"
          value={event.rawLog || ''}
          onChange={(e) => onEventChange({ ...event, rawLog: e.target.value })}
          placeholder="Paste the raw log data here"
          className="font-mono text-sm"
        />
      </div>
    </div>
  );
};