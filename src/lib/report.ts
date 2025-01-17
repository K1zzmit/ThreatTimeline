import type { TimelineEvent, Artifact } from '@/pages/Index';
import type { Incident } from '@/lib/incidents';

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