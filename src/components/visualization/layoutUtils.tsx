import type { TimelineEvent } from '@/pages/Index';
import type { Node, Edge, NodeProps } from 'reactflow';
import ReactFlow, { 
  ReactFlowProvider, 
  Panel,
  getRectOfNodes,
  getTransformForBounds,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import React, { CSSProperties, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toPng } from 'html-to-image';

export const calculateLayout = (events: TimelineEvent[]): { nodes: Node[], edges: Edge[] } => {
  const nodeLevels = new Map<string, number>();
  const processedNodes = new Set<string>();
  const nodePositions = new Map<string, { x: number }>();
  
  // Find lateral movement events and corresponding SERVER events
  const lateralMovementEvents = events.filter(event => 
    event.tactic === 'Lateral Movement' || event.lateralMovementTarget
  );
  
  const rootEvents = events.filter(event => !event.parentId);
  const server2Event = rootEvents.find(event => event.id !== events[0].id);
  
  // Sort all events by timestamp
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Calculate levels based on tree structure
  const calculateLevels = (eventId: string, level: number, isInitialAccessChild: boolean = false) => {
    nodeLevels.set(eventId, level);
    const children = events.filter(event => event.parentId === eventId);
    children.forEach(child => {
      const event = events.find(e => e.id === eventId);
      const isLateralMovementTarget = lateralMovementEvents.some(e => e.lateralMovementTarget === eventId);
      const shouldOffsetMore = (event?.tactic === 'Initial Access' && isLateralMovementTarget) || isInitialAccessChild;
      calculateLevels(child.id, level + (shouldOffsetMore ? 2 : 1), shouldOffsetMore);
    });
  };

  // Calculate levels starting from root events
  rootEvents.forEach(rootEvent => {
    if (server2Event && rootEvent.id === server2Event.id) return;
    calculateLevels(rootEvent.id, 0);
  });

  // For Initial Access events from lateral movement, set their level and calculate their children's levels
  lateralMovementEvents.forEach(lateralEvent => {
    if (lateralEvent.tactic === 'Lateral Movement') {
      // Find the Initial Access event based on the destination hostname in artifacts
      const destinationHost = lateralEvent.artifacts?.find(a => 
        a.type === 'hostname' && 
        a.name === 'Destination Host'
      )?.value;

      const targetEvent = events.find(e => 
        e.tactic === 'Initial Access' && 
        e.host === destinationHost
      );
      
      if (targetEvent) {
        // Set the level of the Initial Access event to be one level below the lateral movement event
        const sourceLevel = nodeLevels.get(lateralEvent.id) || 0;
        nodeLevels.set(targetEvent.id, sourceLevel + 1);
        
        // Calculate levels for any children of the Initial Access event
        const children = events.filter(e => e.parentId === targetEvent.id);
        children.forEach(child => {
          calculateLevels(child.id, sourceLevel + 2);
        });
      }
    }
  });

  // Calculate x positions for root nodes first
  const baseSpacing = 350;
  const rootStartX = -(rootEvents.length - 1) * baseSpacing / 2;
  
  // Position root events
  rootEvents.forEach((rootEvent, index) => {
    if (server2Event && rootEvent.id === server2Event.id) {
      return;
    }
    nodePositions.set(rootEvent.id, { x: rootStartX + index * baseSpacing });
  });

  // Get all nodes at a specific level
  const getNodesAtLevel = (level: number) => {
    return events.filter(event => nodeLevels.get(event.id) === level);
  };

  // Calculate maximum level
  const maxLevel = Math.max(...Array.from(nodeLevels.values()));

  // Position nodes level by level
  for (let level = 1; level <= maxLevel; level++) {
    const nodesAtLevel = getNodesAtLevel(level)
      // Sort nodes by their parent's x position to maintain tree structure
      .sort((a, b) => {
        const parentAPos = nodePositions.get(a.parentId!)?.x || 0;
        const parentBPos = nodePositions.get(b.parentId!)?.x || 0;
        return parentAPos - parentBPos;
      });

    if (nodesAtLevel.length === 0) continue;

    const nodeWidth = 300;
    const siblingSpacing = nodeWidth + 100; // Increased spacing between siblings
    const groupSpacing = 400; // Increased spacing between different parent groups
    
    // Group nodes by their parent
    const nodesByParent = nodesAtLevel.reduce((groups, node) => {
      const parentId = node.parentId!;
      if (!groups[parentId]) groups[parentId] = [];
      groups[parentId].push(node);
      return groups;
    }, {} as Record<string, TimelineEvent[]>);

    // Position each group
    let currentX = 0;
    Object.entries(nodesByParent).forEach(([parentId, nodes], groupIndex) => {
      if (groupIndex > 0) {
        currentX += groupSpacing;
      }
      
      const parentX = nodePositions.get(parentId)?.x || 0;
      const groupWidth = (nodes.length - 1) * siblingSpacing;
      const startX = parentX - (groupWidth / 2);
      
      nodes.forEach((node, index) => {
        const x = startX + (index * siblingSpacing);
        nodePositions.set(node.id, { x });
      });
      
      currentX += groupWidth;
    });
  }

  // Position Initial Access events for lateral movements and their children
  lateralMovementEvents.forEach((lateralEvent) => {
    if (lateralEvent.lateralMovementTarget) {
      const targetEvent = events.find(e => e.id === lateralEvent.lateralMovementTarget);
      if (targetEvent && !targetEvent.parentId) {  // Only adjust root Initial Access events
        const positions = Array.from(nodePositions.values()).map(pos => pos.x);
        const rightmostX = positions.length > 0 ? Math.max(...positions) : 0;
        const targetX = rightmostX + baseSpacing;
        const nodeWidth = 300;
        const siblingSpacing = nodeWidth + 100; // Spacing between siblings
        
        // Position the Initial Access event
        nodePositions.set(targetEvent.id, { x: targetX });
        
        // Recursively get all descendants of the Initial Access event
        const getDescendants = (eventId: string): string[] => {
          const children = events.filter(e => e.parentId === eventId).map(e => e.id);
          const grandchildren = children.flatMap(childId => getDescendants(childId));
          return [...children, ...grandchildren];
        };
        
        // Get all descendants of the Initial Access event
        const descendants = getDescendants(targetEvent.id);
        
        // Recalculate positions for all descendants
        const processLevel = (level: number) => {
          const nodesAtLevel = events
            .filter(e => descendants.includes(e.id) && nodeLevels.get(e.id) === level)
            .sort((a, b) => {
              const parentAPos = nodePositions.get(a.parentId!)?.x || 0;
              const parentBPos = nodePositions.get(b.parentId!)?.x || 0;
              return parentAPos - parentBPos;
            });

          if (nodesAtLevel.length === 0) return;

          const nodesByParent = nodesAtLevel.reduce((groups, node) => {
            const parentId = node.parentId!;
            if (!groups[parentId]) groups[parentId] = [];
            groups[parentId].push(node);
            return groups;
          }, {} as Record<string, TimelineEvent[]>);

          Object.entries(nodesByParent).forEach(([parentId, nodes]) => {
            const parentX = nodePositions.get(parentId)?.x || 0;
            const groupWidth = (nodes.length - 1) * siblingSpacing;
            const startX = parentX - (groupWidth / 2);
            
            nodes.forEach((node, index) => {
              const x = startX + (index * siblingSpacing);
              nodePositions.set(node.id, { x });
            });
          });
        };

        // Process each level of descendants
        for (let level = 1; level <= maxLevel; level++) {
          processLevel(level);
        }
      }
    }
  });

  // Create nodes with calculated positions
  const verticalSpacing = 160;
  const topMargin = 30;
  const initialAccessOffset = 120;
  const nodeWidth = 300;
  const nodeHeight = 100; // Approximate height of a node

  // Helper function to check if two nodes overlap
  const doNodesOverlap = (node1: Node, node2: Node) => {
    const dx = Math.abs(node1.position.x - node2.position.x);
    const dy = Math.abs(node1.position.y - node2.position.y);
    return dx < nodeWidth && dy < nodeHeight;
  };

  // Create initial nodes without handling overlaps
  let nodes: Node[] = events.map((event) => {
    const level = nodeLevels.get(event.id) || 0;
    const position = nodePositions.get(event.id);
    
    if (!position) {
      console.warn(`No position found for event ${event.id}, using default position`);
      const defaultX = event.parentId ? 
        (nodePositions.get(event.parentId)?.x || 0) : 
        0;
      nodePositions.set(event.id, { x: defaultX });
    }
    
    const isLateralMovementTarget = lateralMovementEvents.some(e => e.lateralMovementTarget === event.id);
    const yOffset = (event.tactic === 'Initial Access' && isLateralMovementTarget) ? initialAccessOffset : 0;
    
    return {
    id: event.id,
    type: 'default',
    data: event,
    position: {
        x: nodePositions.get(event.id)!.x,
        y: level * verticalSpacing + topMargin + yOffset
    },
    draggable: true,
    connectable: false,
    selectable: true,
      style: {
        width: nodeWidth,
        background: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '8px',
        cursor: 'grab',
      } as CSSProperties,
    };
  });

  // Sort nodes by timestamp to handle overlaps in chronological order
  nodes.sort((a, b) => new Date(a.data.timestamp).getTime() - new Date(b.data.timestamp).getTime());

  // Handle overlaps by shifting newer nodes down
  for (let i = 0; i < nodes.length; i++) {
    const currentNode = nodes[i];
    let hasOverlap = true;
    let verticalOffset = 0;

    while (hasOverlap) {
      hasOverlap = false;
      for (let j = 0; j < i; j++) {
        if (doNodesOverlap(currentNode, nodes[j])) {
          hasOverlap = true;
          verticalOffset += nodeHeight / 2;
          currentNode.position.y += nodeHeight / 2;
          break;
        }
      }
    }
  }

  // Create edges with straight lines for parent-child relationships
  const edges: Edge[] = [];

  // Create color map for parent-child relationships
  const colorMap = new Map<string, string>();
  const siblingColorMap = new Map<string, string>(); // Maps parent ID to children's color
  const colors = [
    'rgb(59, 130, 246)', // blue
    'rgb(16, 185, 129)', // green
    'rgb(217, 70, 239)', // purple
    'rgb(245, 158, 11)', // orange
    'rgb(148, 163, 184)', // gray
  ];

  // First, assign colors to root nodes
  rootEvents.forEach(event => {
    if (!colorMap.has(event.id)) {
      colorMap.set(event.id, colors[colorMap.size % colors.length]);
    }
  });

  // Helper to get available colors (excluding parent's color)
  const getAvailableColor = (parentColor: string | undefined): string => {
    const availableColors = colors.filter(color => color !== parentColor);
    const usedColors = Array.from(siblingColorMap.values());
    const unusedColors = availableColors.filter(color => !usedColors.includes(color));
    return unusedColors.length > 0 ? 
      unusedColors[0] : 
      availableColors[0]; // Fallback to reusing a color if we run out
  };

  // Assign colors to children (siblings get same color, different from parent)
  const assignChildrenColors = (parentId: string) => {
    if (siblingColorMap.has(parentId)) return; // Already processed this parent's children

    const parentColor = colorMap.get(parentId);
    const childrenColor = getAvailableColor(parentColor);
    siblingColorMap.set(parentId, childrenColor);

    // Find all children of this parent
    const children = events.filter(event => event.parentId === parentId);
    children.forEach(child => {
      colorMap.set(child.id, childrenColor);
      // Recursively process grandchildren
      assignChildrenColors(child.id);
    });
  };

  // Start color assignment from root events
  rootEvents.forEach(root => {
    assignChildrenColors(root.id);
  });

  // Add regular parent-child edges
  events.forEach(event => {
    if (!event.parentId) return;

    const parentEvent = events.find(e => e.id === event.parentId);
    if (!parentEvent) return;

    edges.push({
      id: `${event.parentId}-${event.id}`,
      source: event.parentId,
      target: event.id,
      type: 'straight',
      style: { 
        stroke: colorMap.get(event.id) || 'rgb(148, 163, 184)',
        strokeWidth: 2,
      },
    });
  });

  // Add lateral movement connections with dashed red lines
  events.forEach(event => {
    if (event.tactic === 'Lateral Movement') {
      // Find the Initial Access event based on the destination hostname in artifacts
      const destinationHost = event.artifacts?.find(a => 
        a.type === 'hostname' && 
        a.name === 'Destination Host'
      )?.value;

      const targetEvent = events.find(e => 
        e.tactic === 'Initial Access' && 
        e.host === destinationHost
      );
      
      if (targetEvent) {
        edges.push({
          id: `lateral-${event.id}-${targetEvent.id}`,
          source: event.id,
          target: targetEvent.id,
          animated: true,
          type: 'straight',
          style: { 
            stroke: '#ef4444',
            strokeWidth: 3,
            strokeDasharray: '5,5',
            zIndex: 1000,
          },
          data: {
            isLateralMovement: true
          }
        });
      }
    }
  });

  return { nodes, edges };
};

// Ensure DefaultNode is defined or imported
const DefaultNode: React.FC<NodeProps> = ({ data }) => {
  const isLateralMovement = data.tactic === 'Lateral Movement';
  const isInitialAccess = data.tactic === 'Initial Access';
  
  return (
    <div className="p-4 bg-background border rounded-lg shadow-sm">
      <div className="font-medium">
        {isInitialAccess && <span className="text-blue-400">♦ </span>}
        {data.title || data.tactic}
          </div>
      <div className="text-sm text-muted-foreground mt-1">
        {new Date(data.timestamp).toLocaleString()}
        </div>
        {data.technique && (
        <div className="text-sm text-muted-foreground">
            {data.technique}
          </div>
        )}
    </div>
  );
};

// Create a React component to render the visualization
export const Visualization: React.FC<{ events: TimelineEvent[] }> = ({ events }) => {
  const { nodes, edges } = calculateLayout(events);
  const { getNodes, setNodes, setEdges } = useReactFlow();

  const handleReset = useCallback(() => {
    const { nodes: resetNodes, edges: resetEdges } = calculateLayout(events);
    setNodes(resetNodes);
    setEdges(resetEdges);
  }, [events, setNodes, setEdges]);

  const handleDownload = useCallback(async () => {
    // Get current timestamp for filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `threat-timeline-${timestamp}.png`;
    
    try {
      const nodesBounds = getRectOfNodes(getNodes());
      const transform = getTransformForBounds(
        nodesBounds,
        1920,
        1080,
        0.5,
        2  // minZoom
      );
      
      const element = document.querySelector('.react-flow') as HTMLElement;
      if (!element) return;

      const dataUrl = await toPng(element, {
        backgroundColor: '#030711',
        width: 1920,
        height: 1080,
        style: {
          transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
        },
      });
      
      // Create download link
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting image:', error);
    }
  }, [getNodes]);

  return (
    <div style={{ width: '100%', height: '80vh' }} className="relative">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          nodeTypes={{ default: DefaultNode }}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: false,
          }}
          proOptions={{ hideAttribution: true }}
          minZoom={0.1}
          maxZoom={4}
        >
          <Panel position="top-right" className="bg-background/50 backdrop-blur-sm p-2 rounded-lg flex gap-2">
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              Reset Layout
            </Button>
            <Button
              onClick={handleDownload}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export as PNG
            </Button>
          </Panel>
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
};

