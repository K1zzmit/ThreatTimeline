import type { TimelineEvent, Artifact } from '@/pages/Index';
import type { Incident } from '@/lib/incidents';
import { v4 as uuidv4 } from "uuid";

export const generateReport = (events: TimelineEvent[], incident: Incident): string => {
  const timestamp = new Date().toLocaleString();
  
  // Start with incident details
  let report = `# Incident Response Report
Generated: ${timestamp}

## Incident Details
- Name: ${incident.name}
- Created: ${new Date(incident.createdAt).toLocaleString()}
- Last Updated: ${new Date(incident.updatedAt).toLocaleString()}
${incident.description ? `\nDescription:\n${incident.description}\n` : ''}

## Timeline of Events\n\n`;

  // Sort events by timestamp
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Calculate level for each event
  const getEventLevel = (event: TimelineEvent): number => {
    let level = 0;
    let currentEvent = event;
    while (currentEvent.parentId) {
      level++;
      currentEvent = events.find(e => e.id === currentEvent.parentId) || currentEvent;
      if (level > 5) break; // Prevent infinite loops
    }
    return level;
  };

  // Add each event to the report with appropriate heading level
  sortedEvents.forEach((event, index) => {
    const level = getEventLevel(event);
    // Start at ### (h3) for root events and increase for each level
    const headingLevel = '#'.repeat(3 + level);
    
    report += `${headingLevel} ${index + 1}. ${event.title}\n`;
    report += `- Timestamp: ${new Date(event.timestamp).toLocaleString()} ${event.timezone ? `(${event.timezone})` : ''}\n`;
    if (event.tactic) report += `- Tactic: ${event.tactic}\n`;
    if (event.technique) report += `- Technique: ${event.technique}\n`;
    if (event.description) report += `- Description: ${event.description}\n`;
    
    // Add artifacts if present
    if (event.artifacts && event.artifacts.length > 0) {
      report += '\nArtifacts:\n';
      event.artifacts.forEach(artifact => {
        report += `- ${artifact.name} (${artifact.type}): ${artifact.value}\n`;
      });
    }
    
    report += '\n';
  });

  // Add Artifacts & IOCs Summary section
  report += `## Artifacts & IOCs Summary\n\n`;

  // Collect all unique artifacts grouped by type
  const artifactsByType = new Map<string, Set<string>>();
  events.forEach(event => {
    event.artifacts.forEach(artifact => {
      if (!artifactsByType.has(artifact.type)) {
        artifactsByType.set(artifact.type, new Set());
      }
      artifactsByType.get(artifact.type)?.add(artifact.value);
      // Add linked values if they exist
      if (artifact.linkedValue) {
        artifactsByType.get(artifact.type)?.add(artifact.linkedValue);
      }
    });
  });

  // Add each artifact type and its unique values
  Array.from(artifactsByType.entries()).sort().forEach(([type, values]) => {
    report += `### ${type.charAt(0).toUpperCase() + type.slice(1)}s\n`;
    Array.from(values).sort().forEach(value => {
      report += `- ${value}\n`;
    });
    report += '\n';
  });

  return report;
};

export function parseReport(markdown: string): { incident: Incident; events: TimelineEvent[] } {
  const lines = markdown.split('\n');
  let incident: Incident = {
    id: uuidv4(),
    name: '',
    description: '',
    events: []
  };
  const events: TimelineEvent[] = [];
  let currentEvent: Partial<TimelineEvent> | null = null;
  let description = '';

  for (const line of lines) {
    if (line.startsWith('# Incident Report:')) {
      incident.name = line.replace('# Incident Report:', '').trim();
    } else if (line.startsWith('## Description')) {
      // Start collecting description
      description = '';
    } else if (line.startsWith('## Timeline')) {
      // End description collection and set it
      incident.description = description.trim();
    } else if (line.startsWith('### Event:')) {
      // Save previous event if exists
      if (currentEvent && currentEvent.title) {
        events.push(currentEvent as TimelineEvent);
      }
      // Start new event
      currentEvent = {
        id: uuidv4(),
        title: line.replace('### Event:', '').trim(),
        description: '',
        artifacts: [],
        timestamp: new Date().toISOString().slice(0, 16)
      };
    } else if (line.startsWith('- Timestamp:') && currentEvent) {
      currentEvent.timestamp = line.replace('- Timestamp:', '').trim();
    } else if (line.startsWith('- Description:') && currentEvent) {
      currentEvent.description = line.replace('- Description:', '').trim();
    } else if (line.startsWith('- Tactic:') && currentEvent) {
      currentEvent.tactic = line.replace('- Tactic:', '').trim();
    } else if (line.startsWith('- Technique:') && currentEvent) {
      currentEvent.technique = line.replace('- Technique:', '').trim();
    } else if (!line.startsWith('#') && !line.startsWith('-') && line.trim()) {
      // If we're in description section, append to description
      if (!currentEvent) {
        description += line + '\n';
      }
    }
  }

  // Add the last event if exists
  if (currentEvent && currentEvent.title) {
    events.push(currentEvent as TimelineEvent);
  }

  return { incident, events };
} 