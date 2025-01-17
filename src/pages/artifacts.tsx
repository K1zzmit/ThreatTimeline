import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ExternalLink, Search } from 'lucide-react';
import type { Artifact, TimelineEvent } from './Index';
import { useToast } from '@/components/ui/use-toast';
import type { TimelineRef } from '@/components/Timeline';
import { ActionButtons } from '@/components/ActionButtons';
import { Input } from '@/components/ui/input';

interface ArtifactGroup {
  type: string;
  items: {
    value: string;
    linkedValue?: string;
    names: string[];
    commands?: string[];
    customArtifacts?: {
      value: string;
      linkedValue?: string;
      eventTitle?: string;
      timestamp?: string;
      eventId?: string;
      name?: string;
    }[];
    events: {
      id: string;
      title: string;
      timestamp: string;
    }[];
  }[];
}

interface ArtifactsPageProps {
  timelineRef: React.RefObject<TimelineRef>;
  onTabChange: (value: string) => void;
  events: TimelineEvent[];
}

interface GroupedArtifacts {
  hostnames: Artifact[];
  domains: Artifact[];
  files: Artifact[];
  ips: Artifact[];
  hashes: Artifact[];
  users: Artifact[];
  commands: Artifact[];
  custom: Artifact[];
}

const ArtifactsPage: React.FC<ArtifactsPageProps> = ({ timelineRef, onTabChange, events }) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  // Group artifacts by type and deduplicate
  const artifactGroups = React.useMemo(() => {
    const groups: Record<string, ArtifactGroup> = {};

    events.forEach(event => {
      event.artifacts?.forEach(artifact => {
        if (!groups[artifact.type]) {
          groups[artifact.type] = {
            type: artifact.type,
            items: []
          };
        }

        // Special handling for custom artifacts - group by event
        if (artifact.type === 'custom') {
          let existingItem = groups[artifact.type].items.find(
            item => item.value === artifact.name  // Group by artifact name instead of event ID
          );

          if (!existingItem) {
            existingItem = {
              value: artifact.name, // Use artifact name as the main grouping value
              names: [],
              events: [{
                id: event.id,
                title: event.title,
                timestamp: event.timestamp
              }],
              customArtifacts: [] // Array to store artifacts with this name
            };
            groups[artifact.type].items.push(existingItem);
          } else {
            // Add event if not already present
            if (!existingItem.events.some(e => e.id === event.id)) {
              existingItem.events.push({
                id: event.id,
                title: event.title,
                timestamp: event.timestamp
              });
            }
          }

          // Add the custom artifact to this group's collection
          existingItem.customArtifacts = existingItem.customArtifacts || [];
          existingItem.customArtifacts.push({
            value: artifact.value,
            linkedValue: artifact.linkedValue,
            eventTitle: event.title,
            timestamp: event.timestamp,
            eventId: event.id
          });
        } else if (artifact.type === 'command') {
          // Group by binary name (which is in artifactName)
          let existingItem = groups[artifact.type].items.find(
            item => item.value === artifact.name  // Group by binary name
          );

          if (!existingItem) {
            existingItem = {
              value: artifact.name,    // Binary name
              names: [],              // Will store command names
              commands: [artifact.value],  // Store the full command
              events: [{
                id: event.id,
                title: event.title,
                timestamp: event.timestamp
              }]
            };
            groups[artifact.type].items.push(existingItem);
          } else {
            // Add the command if it's not already in the list
            if (!existingItem.commands?.includes(artifact.value)) {
              existingItem.commands = existingItem.commands || [];
              existingItem.commands.push(artifact.value);
            }
            // Add event if not already present
            if (!existingItem.events.some(e => e.id === event.id)) {
              existingItem.events.push({
                id: event.id,
                title: event.title,
                timestamp: event.timestamp
              });
            }
          }
        } else {
          // Handle other artifact types as before
          let existingItem = groups[artifact.type].items.find(
            item => item.value === artifact.value
          );

          if (!existingItem) {
            existingItem = {
              value: artifact.value,
              linkedValue: artifact.linkedValue,
              names: [artifact.name],
              events: []
            };
            groups[artifact.type].items.push(existingItem);
          } else {
            if (!existingItem.names.includes(artifact.name)) {
              existingItem.names.push(artifact.name);
            }
          }

          // Add event reference if not already present
          if (!existingItem.events.some(e => e.id === event.id)) {
            existingItem.events.push({
              id: event.id,
              title: event.title,
              timestamp: event.timestamp
            });
          }
        }
      });
    });

    // Filter groups based on search query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      Object.keys(groups).forEach(type => {
        groups[type].items = groups[type].items.filter(item => {
          if (type === 'custom') {
            return item.customArtifacts?.some(artifact =>
              artifact.value.toLowerCase().includes(lowerQuery) ||
              artifact.name.toLowerCase().includes(lowerQuery) ||
              artifact.linkedValue?.toLowerCase().includes(lowerQuery)
            );
          }
          return (
            item.value.toLowerCase().includes(lowerQuery) ||
            item.linkedValue?.toLowerCase().includes(lowerQuery) ||
            item.names.some(name => name.toLowerCase().includes(lowerQuery))
          );
        });
      });
    }

    return Object.values(groups).filter(group => group.items.length > 0);
  }, [events, searchQuery]);

  // Get the default tab value
  const defaultTab = artifactGroups[0]?.type || 'hostname';
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Update active tab if the current one doesn't exist anymore
  React.useEffect(() => {
    if (!artifactGroups.find(group => group.type === activeTab) && artifactGroups.length > 0) {
      setActiveTab(artifactGroups[0].type);
    }
  }, [artifactGroups, activeTab]);

  const handleEventClick = (eventId: string) => {
    console.log('ArtifactsPage: handleEventClick called with eventId:', eventId);
    
    // Switch to timeline tab using the callback
    onTabChange('timeline');
    console.log('ArtifactsPage: Switched to timeline tab');
    
    // Give the timeline a moment to render and then select the event
    setTimeout(() => {
      console.log('ArtifactsPage: Inside setTimeout, timelineRef:', timelineRef.current);
      if (timelineRef.current) {
        console.log('ArtifactsPage: Calling selectEvent');
        timelineRef.current.selectEvent(eventId);
      }
    }, 200);
  };

  const groupedArtifacts = events.reduce((acc: GroupedArtifacts, event) => {
    event.artifacts?.forEach(artifact => {
      switch (artifact.type) {
        case 'hostname':
          if (!acc.hostnames.some(a => a.value === artifact.value)) {
            acc.hostnames.push(artifact);
          }
          break;
        case 'command':
          acc.commands.push(artifact);
          break;
        case 'custom':
          if (!acc.custom.some(a => a.value === artifact.value)) {
            acc.custom.push(artifact);
          }
          break;
      }
    });
    return acc;
  }, {
    hostnames: [],
    domains: [],
    files: [],
    ips: [],
    hashes: [],
    users: [],
    commands: [],
    custom: []
  });

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Artifacts & IOCs</CardTitle>
        <ActionButtons
          page="artifacts"
          events={events}
        />
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search artifacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="w-full flex-wrap h-auto gap-2 justify-start">
            {artifactGroups.map(group => (
              <TabsTrigger key={group.type} value={group.type} className="capitalize">
                {group.type}
                <span className="ml-2 text-xs bg-primary/10 px-2 py-0.5 rounded-full">
                  {group.items.length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {artifactGroups.map(group => (
            group.type !== 'command' && (
              <TabsContent key={group.type} value={group.type}>
                <Card>
                  <CardHeader>
                    <CardTitle className="capitalize">{group.type} Artifacts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[60vh]">
                      <div className="space-y-4">
                        {group.items.map((item, index) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex items-start justify-between">
                              <div>
                                {group.type === 'custom' ? (
                                  <>
                                    <h3 className="font-medium">{item.value}</h3>
                                    <div className="mt-2 space-y-2">
                                      {item.customArtifacts?.map((artifact, i) => (
                                        <div key={i} className="text-sm pl-4 border-l-2 border-muted">
                                          <div>{artifact.value}</div>
                                          {artifact.linkedValue && (
                                            <div className="text-muted-foreground">
                                              → {artifact.linkedValue}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <h3 className="font-medium flex items-center gap-2">
                                      {item.value}
                                      {item.linkedValue && (
                                        <span className="text-sm text-muted-foreground">
                                          ({item.linkedValue})
                                        </span>
                                      )}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      Observed as: 
                                      {item.names.map((name, i) => (
                                        <React.Fragment key={i}>
                                          <br />• {name}
                                        </React.Fragment>
                                      ))}
                                    </p>
                                  </>
                                )}
                              </div>
                              <span className="text-xs bg-primary/10 px-2 py-1 rounded">
                                {item.events.length} {item.events.length === 1 ? 'event' : 'events'}
                              </span>
                            </div>

                            <div className="mt-4 space-y-2">
                              <h4 className="text-sm font-medium">Related Events:</h4>
                              {item.events.map((event, eventIndex) => (
                                <Button
                                  key={eventIndex}
                                  variant="ghost"
                                  className="w-full justify-start text-left"
                                  onClick={() => handleEventClick(event.id)}
                                >
                                  <div className="flex items-center gap-2">
                                    <ExternalLink className="h-4 w-4" />
                                    <div>
                                      <div className="font-medium">{event.title}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {new Date(event.timestamp).toLocaleString()}
                                      </div>
                                    </div>
                                  </div>
                                </Button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            )
          ))}
          <TabsContent value="command">
            <Card>
              <CardHeader>
                <CardTitle className="capitalize">Command Artifacts</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[60vh]">
                  <div className="space-y-4">
                    {artifactGroups
                      .find(group => group.type === 'command')
                      ?.items.map((item, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium">{item.value}</h3>
                              <div className="mt-2 space-y-1">
                                {item.commands?.map((command, i) => (
                                  <div key={i} className="text-sm text-muted-foreground pl-4 border-l-2 border-muted">
                                    {command}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <span className="text-xs bg-primary/10 px-2 py-1 rounded">
                              {item.events.length} {item.events.length === 1 ? 'event' : 'events'}
                            </span>
                          </div>

                          <div className="mt-4">
                            <h4 className="text-sm font-medium">Related Events:</h4>
                            {item.events.map((event, eventIndex) => (
                              <Button
                                key={eventIndex}
                                variant="ghost"
                                className="w-full justify-start text-left mt-2"
                                onClick={() => handleEventClick(event.id)}
                              >
                                <div className="flex items-center gap-2">
                                  <ExternalLink className="h-4 w-4" />
                                  <div>
                                    <div className="font-medium">{event.title}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {new Date(event.timestamp).toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                              </Button>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ArtifactsPage; 