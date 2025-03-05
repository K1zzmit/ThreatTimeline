export function calculateLayout(events: TimelineEvent[]) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const positions: { [key: string]: { x: number; y: number } } = {};

  // Create nodes first
  events.forEach((event) => {
    nodes.push({
      id: event.id,
      type: 'default',
      position: positions[event.id] || { x: 0, y: 0 },
      data: event,
    });

    // Create parent-child edges
    if (event.parentId) {
      edges.push({
        id: `${event.parentId}-${event.id}`,
        source: event.parentId,
        target: event.id,
        type: 'default',
      });
    }

    // Create lateral movement edges
    if (event.lateralMovementTarget) {
      edges.push({
        id: `lateral-${event.id}-${event.lateralMovementTarget}`,
        source: event.id,
        target: event.lateralMovementTarget,
        type: 'default',
        data: {
          isLateralMovement: true
        }
      });
    }
  });

  // Calculate positions...
  // ... rest of the existing layout code ...

  return { nodes, edges };
} 