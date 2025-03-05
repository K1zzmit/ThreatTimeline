import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FileUp } from 'lucide-react';
import type { TimelineEvent } from '@/pages/Index';
import type { Incident } from '@/lib/incidents';
import { parseReport } from '@/lib/report';

interface ImportButtonProps {
  onImport: (data: { incident: Incident; events: TimelineEvent[] }) => void;
}

export const ImportButton: React.FC<ImportButtonProps> = ({ onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const { incident, events } = parseReport(text);
      
      onImport({ incident, events });
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error importing report:', error);
      // TODO: Add proper error handling/user feedback
      alert('Error importing report. Please check the file format.');
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".md"
        style={{ display: 'none' }}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={handleImportClick}
        className="gap-2"
      >
        <FileUp className="h-4 w-4" />
        Import Report
      </Button>
    </>
  );
}; 