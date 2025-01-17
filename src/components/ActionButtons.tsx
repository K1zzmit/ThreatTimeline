import { Button } from "@/components/ui/button";
import * as Dropdown from "@/components/ui/dropdown-menu";
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
  onExportSvg?: () => void;
}

export function ActionButtons({
  page,
  events,
  incident,
  onEditMode,
  onResetLayout,
  onExportPng,
  onExportSvg,
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
          <Dropdown.DropdownMenu>
            <Dropdown.DropdownMenuTrigger asChild> 
              <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
                Export
          </Button>
            </Dropdown.DropdownMenuTrigger>

            <Dropdown.DropdownMenuPortal>
				      <Dropdown.DropdownMenuContent align="center">
                <Dropdown.DropdownMenuItem onClick={onExportPng}>
                  As PNG
					      </Dropdown.DropdownMenuItem>
					      <Dropdown.DropdownMenuItem onClick={onExportSvg} >
                  As SVG
					      </Dropdown.DropdownMenuItem>
              </Dropdown.DropdownMenuContent>
            </Dropdown.DropdownMenuPortal>    
          </Dropdown.DropdownMenu>
        </>
      )}

      {page === 'artifacts' && (
        <ReportButton events={events} />
      )}
    </div>
  );
} 