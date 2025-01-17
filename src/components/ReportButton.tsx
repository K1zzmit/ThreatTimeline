import React from 'react';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import { generateReport } from '@/lib/report';
import type { TimelineEvent } from '@/pages/Index';
import type { Incident } from '@/lib/incidents';

interface ReportButtonProps {
  incident?: Incident;
  events: TimelineEvent[];
}

export const ReportButton: React.FC<ReportButtonProps> = ({ incident, events }) => {
  const handleGenerateReport = () => {
    if (!incident) {
      console.warn('No incident selected for report generation');
      return;
    }

    // Generate the report
    const report = generateReport(events, incident);
    
    // Create a blob with the markdown content
    const blob = new Blob([report], { type: 'text/markdown' });
    
    // Create a download link with incident name in filename
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Format the date for the filename
    const date = new Date().toISOString().split('T')[0];
    const sanitizedIncidentName = incident.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    a.download = `incident-report-${sanitizedIncidentName}-${date}.md`;
    
    // Trigger the download
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleGenerateReport}
      className="gap-2"
      disabled={!incident}
    >
      <FileDown className="h-4 w-4" />
      Export Report
    </Button>
  );
}; 