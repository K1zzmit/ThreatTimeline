import { Button } from "@/components/ui/button";
import * as Dropdown from "@/components/ui/dropdown-menu";
import { Eye, Edit2, RotateCcw, Download, Plus, FileDown } from "lucide-react";
import { ReportButton } from "@/components/ReportButton";
import { ImportButton } from "@/components/ImportButton";
import type { TimelineEvent } from "@/pages/Index";
import type { Incident } from "@/lib/incidents";
import { useToast } from "./ui/use-toast";

interface ActionButtonsProps {
  page?: "timeline" | "visualization" | "artifacts";
  events?: TimelineEvent[];
  incident?: Incident;
  isEditMode?: boolean;
  onEditMode?: () => void;
  onAddEvent?: () => void;
  onImport?: (data: { incident: any; events: TimelineEvent[] }) => void;
  // Visualization specific props
  onResetLayout?: () => void;
  onExportPng?: () => void;
  onExportSvg?: () => void;
}

export function ActionButtons({
  page = "timeline",
  events,
  incident,
  onEditMode,
  onAddEvent,
  onImport,
  onResetLayout,
  onExportPng,
  onExportSvg,
  isEditMode,
}: ActionButtonsProps) {
  const { toast } = useToast();

  if (page === "visualization") {
    return (
      <div className="flex items-center gap-2">
        {onResetLayout && (
          <Button variant="outline" size="sm" onClick={onResetLayout}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Layout
          </Button>
        )}
        {(onExportPng || onExportSvg) && (
          <Dropdown.DropdownMenu>
            <Dropdown.DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </Dropdown.DropdownMenuTrigger>
            <Dropdown.DropdownMenuContent align="end">
              {onExportPng && (
                <Dropdown.DropdownMenuItem onClick={onExportPng}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Export as PNG
                </Dropdown.DropdownMenuItem>
              )}
              {onExportSvg && (
                <Dropdown.DropdownMenuItem onClick={onExportSvg}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Export as SVG
                </Dropdown.DropdownMenuItem>
              )}
            </Dropdown.DropdownMenuContent>
          </Dropdown.DropdownMenu>
        )}
      </div>
    );
  }

  if (page === "timeline") {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant={isEditMode ? "outline" : "default"}
            size="sm"
            onClick={onEditMode}
            className={!isEditMode ? "border-2 border-primary shadow-sm hover:shadow-md transition-shadow" : ""}
          >
            {isEditMode ? (
              <>
                <Eye className="h-4 w-4 mr-2" />
                View Mode
              </>
            ) : (
              <>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Timeline
              </>
            )}
          </Button>
          {isEditMode && <ReportButton incident={incident} events={events} />}
        </div>
        {isEditMode && onAddEvent && (
          <Button variant="default" size="sm" onClick={onAddEvent}>
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        )}
        {onImport && <ImportButton onImport={onImport} />}
      </div>
    );
  }

  return null;
} 