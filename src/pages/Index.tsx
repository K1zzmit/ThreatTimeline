import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Timeline, { TimelineRef } from "@/components/Timeline";
import Visualization from "@/components/Visualization";
import ArtifactsPage from "./artifacts";
import { useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Eye, Edit2, Database, RotateCcw, Download, Clock, NetworkIcon } from "lucide-react";
import { useIncidents } from "@/lib/incidents";
import type { XYPosition } from "reactflow";
import { ReportButton } from "@/components/ReportButton";
import { ImportButton } from "@/components/ImportButton";
import { IncidentSelector } from "@/components/IncidentSelector";

export interface NetworkDetails {
  proxyIp?: string;
  port?: string;
  destinationIp?: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  timezone?: string;
  title: string;
  description: string;
  color?: string;
  tactic?: string;
  technique?: string;
  parentId?: string;
  artifacts: Artifact[];
  order?: number;
  // Additional fields for event details
  searchQuery?: string;
  rawLog?: string;
  attachedFile?: string;
  // Legacy fields (to maintain compatibility)
  host?: string;
  user?: string;
  process?: string;
  sha256?: string;
  networkDetails?: NetworkDetails;
  lateralMovementSource?: string;
  lateralMovementTarget?: string;
  // UI state
  initialView?: 'details' | 'search' | 'log';
}

export type Artifact = {
  type: 'hostname' | 'domain' | 'file' | 'ip' | 'hash' | 'user' | 'command' | 'custom';
  name: string;
  value: string;
  linkedValue?: string;
  linkedArtifactId?: string;
  hostContext?: string;
};

export default function Index() {
  const [activeTab, setActiveTab] = useState("timeline");
  const [isEditMode, setIsEditMode] = useState(false);
  const timelineRef = useRef<TimelineRef>(null);
  const { toast } = useToast();
  const [nodePositions, setNodePositions] = useState<Record<string, XYPosition>>({});
  const visualizationRef = useRef<{ exportAsPng: () => Promise<void> }>(null);
  
  const {
    incidents,
    activeIncident,
    activeIncidentId,
    createIncident,
    updateIncident,
    deleteIncident,
    setActiveIncident,
    updateEvents
  } = useIncidents();

  const handleAddEvent = (parentId?: string) => {
    if (!activeIncidentId) {
      // Create a new incident first
      const createNewIncident = (name: string, description?: string) => {
        const newIncidentId = createIncident(name, description);
        // After incident is created, create the new event
        const newEventId = handleAddEvent(parentId);
        return newEventId;
      };

      // Programmatically open the incident creation dialog
      const incidentSelectorElement = document.querySelector('[data-create-incident-trigger]');
      if (incidentSelectorElement instanceof HTMLElement) {
        incidentSelectorElement.click();
        return null;
      }

      // Fallback if button not found
      toast({
        title: "Error",
        description: "Could not open incident creation dialog",
        variant: "destructive",
      });
      return null;
    }

    try {
      let timestamp = new Date().toISOString().slice(0, 19);
      let timezone = 'UTC';

      // If this is a child event, inherit artifacts from the parent
      let inheritedArtifacts: Artifact[] = [];
      if (parentId && activeIncident) {
        const parentEvent = activeIncident.events.find(e => e.id === parentId);
        if (parentEvent) {
          timestamp = parentEvent.timestamp;
          timezone = parentEvent.timezone || 'UTC';
          inheritedArtifacts = parentEvent.artifacts;
        }
      }

      const newEvent: TimelineEvent = {
        id: uuidv4(),
        timestamp,
        timezone,
        title: "",
        description: "",
        artifacts: inheritedArtifacts, // Use inherited artifacts
        parentId: typeof parentId === 'string' ? parentId : undefined,
      };
      
      const updatedEvents = [...(activeIncident?.events || []), newEvent];
      updateEvents(activeIncidentId, updatedEvents);
      
      return newEvent.id;
    } catch (error) {
      console.error('Error adding event:', error);
      toast({
        title: "Error",
        description: "Failed to add event",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleUpdateEvent = (updatedEvent: TimelineEvent) => {
    if (!activeIncidentId || !activeIncident) return;

    try {
      const updatedEvents = activeIncident.events.map(event => 
        event.id === updatedEvent.id ? updatedEvent : event
      );
      
      updateEvents(activeIncidentId, updatedEvents);
      
      toast({
        title: "Event Updated",
        description: "Changes have been saved successfully.",
      });
    } catch (error) {
      console.error('Error in handleUpdateEvent:', error);
      toast({
        title: "Error",
        description: "Failed to update event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    if (!activeIncidentId || !activeIncident) return;

    try {
      const getDescendantIds = (parentId: string): string[] => {
        const children = activeIncident.events.filter(event => event.parentId === parentId);
        return [
          ...children.map(child => child.id),
          ...children.flatMap(child => getDescendantIds(child.id))
        ];
      };
      
      const idsToDelete = [eventId, ...getDescendantIds(eventId)];
      const updatedEvents = activeIncident.events.filter(event => !idsToDelete.includes(event.id));
      
      updateEvents(activeIncidentId, updatedEvents);
    } catch (error) {
      console.error('Error in handleDeleteEvent:', error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <IncidentSelector
          incidents={incidents}
          activeIncidentId={activeIncidentId}
          onCreateIncident={createIncident}
          onSelectIncident={setActiveIncident}
          onDeleteIncident={deleteIncident}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">
            <Clock className="mr-2 h-4 w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="visualization">
            <NetworkIcon className="mr-2 h-4 w-4" />
            Visualization
          </TabsTrigger>
          <TabsTrigger value="artifacts">
            <Database className="mr-2 h-4 w-4" />
            Artifacts & IOCs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <Timeline
            ref={timelineRef}
            events={activeIncident?.events || []}
            incident={activeIncident}
            onAddEvent={handleAddEvent}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
            isEditMode={isEditMode}
            onEditModeToggle={() => setIsEditMode(!isEditMode)}
            onSelectEvent={(event) => {
              toast({
                title: "Event Selected",
                description: `Selected: ${event.title || 'Untitled Event'}`,
              });
            }}
            onImport={({ incident: importedIncident, events: importedEvents }) => {
              try {
                // Create a new incident
                const newIncidentId = createIncident(
                  importedIncident.name || "Imported Incident",
                  importedIncident.description
                );

                if (!newIncidentId) {
                  throw new Error("Failed to create incident");
                }

                // Update the events, preserving their relationships
                const eventMap = new Map<string, string>();
                const updatedEvents = importedEvents.map(event => {
                  const newId = uuidv4();
                  eventMap.set(event.id, newId);
                  return {
                    ...event,
                    id: newId,
                    parentId: event.parentId ? eventMap.get(event.parentId) : undefined,
                    lateralMovementTarget: event.lateralMovementTarget ? eventMap.get(event.lateralMovementTarget) : undefined
                  };
                });

                // Update the incident with the new events
                updateEvents(newIncidentId, updatedEvents);
                
                // Switch to the new incident
                setActiveIncident(newIncidentId);

                toast({
                  title: "Import Successful",
                  description: `Imported incident "${importedIncident.name}" with ${importedEvents.length} events`,
                });
              } catch (error) {
                console.error('Error importing incident:', error);
                toast({
                  title: "Import Failed",
                  description: "Failed to import the incident. Please try again.",
                  variant: "destructive"
                });
              }
            }}
            onLateralMovement={(sourceEvent, destinationHost) => {
              if (!activeIncidentId || !activeIncident) return;
              
              // Parse destination host string to extract hostname and IP
              let destHostname: string | undefined;
              let destIP: string | undefined;
              
              // Check if the destination contains both hostname and IP
              const ipMatch = destinationHost.match(/^(.*?)\s*\((.*?)\)$/);
              if (ipMatch) {
                destHostname = ipMatch[1];
                destIP = ipMatch[2];
              } else {
                destHostname = destinationHost;
              }

              // Find the maximum order in current events
              const maxOrder = Math.max(0, ...activeIncident.events.map(e => e.order || 0));

              // Get source host information from the source event's artifacts or host field
              const sourceHostArtifact = sourceEvent.artifacts.find(a => a.type === 'hostname' && a.name === 'Source Host');
              const sourceHostname = sourceHostArtifact?.value || sourceEvent.host || '';
              const sourceIP = sourceHostArtifact?.linkedValue;

              // Create the initial access event
              const initialAccessEvent: TimelineEvent = {
                id: uuidv4(),
                timestamp: "", // Leave timestamp blank for user to fill in
                timezone: sourceEvent.timezone,
                title: `Initial Access on ${destHostname || destIP}`,
                description: ``,
                tactic: "Initial Access",
                technique: "Valid Accounts",
                artifacts: [
                  {
                    type: "hostname" as const,
                    name: "Source Host",
                    value: destHostname || destIP || '',
                    linkedValue: destIP && destHostname ? destIP : undefined
                  }
                ],
                host: destHostname || destIP,
                parentId: undefined,
                order: maxOrder + 1
              };
              
              // Update the source event with lateral movement info
              const updatedEvents = activeIncident.events.map(event => {
                if (event.id === sourceEvent.id) {
                  return {
                    ...event,
                    tactic: "Lateral Movement",
                    technique: "Remote Services",
                    artifacts: [
                      ...event.artifacts.filter(a => !['Source Host', 'Destination Host'].includes(a.name)),
                      {
                        type: "hostname" as const,
                        name: "Source Host",
                        value: sourceHostname,
                        linkedValue: sourceIP
                      },
                      {
                        type: "hostname" as const,
                        name: "Destination Host",
                        value: destHostname || destIP || '',
                        linkedValue: destIP && destHostname ? destIP : undefined
                      }
                    ],
                    lateralMovementTarget: initialAccessEvent.id
                  };
                }
                return event;
              });
              
              // Add the new initial access event
              updatedEvents.push(initialAccessEvent);
              
              updateEvents(activeIncidentId, updatedEvents);
              
              toast({
                title: "Lateral Movement Created",
                description: `Added lateral movement to ${destinationHost}. Please set the timestamp for the new event.`,
              });
            }}
          />
        </TabsContent>

        <TabsContent value="visualization">
          <Visualization
            events={activeIncident?.events || []}
            savedPositions={nodePositions}
            onPositionsChange={setNodePositions}
            onResetRequest={() => {
              setNodePositions({});
              toast({
                title: "Layout Reset",
                description: "Node positions have been reset to their original layout.",
              });
            }}
          />
        </TabsContent>

        <TabsContent value="artifacts">
          <ArtifactsPage
            timelineRef={timelineRef}
            onTabChange={setActiveTab}
            events={activeIncident?.events || []}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
