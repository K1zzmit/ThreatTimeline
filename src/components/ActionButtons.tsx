import { Button } from "@/components/ui/button";
import { Eye, Edit2, RotateCcw, Download } from "lucide-react";
import { ReportButton } from "@/components/ReportButton";
import type { TimelineEvent } from "@/pages/Index";
import type { Incident } from "@/lib/incidents";

interface ActionButtonsProps {
  page: 'timeline' | 'visualization' | 'artifacts';
  events: TimelineEvent[];
  incident?: Incident;
  // Timeline specific props
  onEditMode?: () => void;
  isEditMode?: boolean;
  // Visualization specific props
  onResetLayout?: () => void;
  onExportPng?: () => void;
}

export function ActionButtons({
  page,
  events,
  incident,
  onEditMode,
  onResetLayout,
  onExportPng,
  isEditMode,
}: ActionButtonsProps) {
  return (
    <div className="flex gap-2">
      {page === 'timeline' && (
        <>
          <Button
            variant={isEditMode ? "default" : "outline"}
            onClick={onEditMode}
          >
            {isEditMode ? (
              <Eye className="mr-2 h-4 w-4" />
            ) : (
              <Edit2 className="mr-2 h-4 w-4" />
            )}
            {isEditMode ? "View Mode" : "Edit Mode"}
          </Button>
          <ReportButton incident={incident} events={events} />
        </>
      )}

      {page === 'visualization' && (
        <>
          <Button variant="outline" onClick={onResetLayout}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Layout
          </Button>
          <Button variant="outline" onClick={onExportPng}>
            <Download className="mr-2 h-4 w-4" />
            Export as PNG
          </Button>
        </>
      )}

      {page === 'artifacts' && (
        <ReportButton events={events} />
      )}
    </div>
  );
} 