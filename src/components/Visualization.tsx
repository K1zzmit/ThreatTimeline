import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  Handle,
  Position,
  BaseEdge,
  EdgeProps,
  getSmoothStepPath,
  getBezierPath,
  NodeDragHandler,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  XYPosition,
  ReactFlowProvider,
  Panel,
  getRectOfNodes,
  getTransformForBounds,
  useReactFlow,
  getNodesBounds,
  getViewportForBounds,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { TimelineEvent } from '@/pages/Index';
import { calculateLayout } from './visualization/layoutUtils';
import { cn } from '@/lib/utils';
import { ActionButtons } from './ActionButtons';
import { toPng, toSvg } from 'html-to-image';

interface VisualizationProps {
  events: TimelineEvent[];
  savedPositions?: Record<string, XYPosition>;
  onPositionsChange?: (positions: Record<string, XYPosition>) => void;
  onResetRequest?: () => void;
}

// Custom Edge Component
const CustomEdge = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition = Position.Bottom,
  targetPosition = Position.Top,
  style,
  markerEnd,
  data
}: EdgeProps) => {
  const isLateralMovement = data?.isLateralMovement;
  
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  
  return (
    <path
      d={edgePath}
      fill="none"
      style={{
        ...style,
        strokeDasharray: isLateralMovement ? '5,5' : 'none',
        stroke: isLateralMovement ? '#ef4444' : style?.stroke,
        strokeWidth: isLateralMovement ? 3 : 2,
      }}
      markerEnd={markerEnd}
    />
  );
};

// Custom Node Component
const EventNode = ({ data }: { data: TimelineEvent }) => {
  const isRootEvent = !data.parentId;
  
  return (
    <div className={cn(
      "px-4 py-2 shadow-lg rounded-lg border bg-background",
      data.color.includes("blue") && "ring-2 ring-blue-500/50 shadow-blue-500/10",
      data.color.includes("green") && "ring-2 ring-green-500/50 shadow-green-500/10",
      data.color.includes("purple") && "ring-2 ring-purple-500/50 shadow-purple-500/10",
      data.color.includes("orange") && "ring-2 ring-orange-500/50 shadow-orange-500/10",
      data.color.includes("pink") && "ring-2 ring-pink-500/50 shadow-pink-500/10",
      data.color.includes("teal") && "ring-2 ring-teal-500/50 shadow-teal-500/10",
      isRootEvent && "ring-2 ring-primary shadow-primary/30",
    )}>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-muted-foreground"
      />
      <div className="flex flex-col gap-2">
        <div className="text-sm font-medium flex items-center gap-2">
          {isRootEvent && <span className="text-primary">◆</span>}
          {data.title || "Untitled Event"}
        </div>
        {data.tactic && (
          <div className={cn(
            "text-xs px-2 py-1 rounded-full bg-accent text-accent-foreground w-fit",
            data.tactic === "Lateral Movement" && "bg-red-500/10 text-red-500"
          )}>
            {data.tactic}
          </div>
        )}
        {data.technique && (
          <div className="text-xs px-2 py-1 rounded bg-primary/10 text-primary w-fit mt-1">
            {data.technique}
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-muted-foreground"
      />
    </div>
  );
};

const Flow: React.FC<VisualizationProps> = ({ 
  events, 
  savedPositions,
  onPositionsChange,
  onResetRequest,
}) => {
  const reactFlowWrapper = React.useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView, getNodes } = useReactFlow();

  // Define node and edge types
  const nodeTypes = React.useMemo(() => ({ default: EventNode }), []);
  const edgeTypes = React.useMemo(() => ({ 
    default: CustomEdge,
    smoothstep: CustomEdge 
  }), []);

  const handleNodeDragStop: NodeDragHandler = (event, node) => {
    if (onPositionsChange) {
      const newPositions = nodes.reduce((acc, n) => ({
        ...acc,
        [n.id]: { x: n.position.x, y: n.position.y }
      }), {});
      onPositionsChange(newPositions);
    }
  };

  const handleExportImage = useCallback(async (exportFunc: typeof toPng | typeof toSvg, fileType: 'png' | 'svg') => {
    if (!reactFlowWrapper.current) return;

    try {
      // Get all nodes and calculate bounds
      const nodes = getNodes();
      const nodesBounds = getNodesBounds(nodes);
      
      // Add padding to the bounds
      const padding = 50;
      nodesBounds.x -= padding;
      nodesBounds.y -= padding;
      nodesBounds.width += 2 * padding;
      nodesBounds.height += 2 * padding;

      // Calculate viewport that fits all nodes
      const viewport = getViewportForBounds(
        nodesBounds,
        nodesBounds.width,
        nodesBounds.height,
        0.5,
        2
      );

      const dataUrl = await exportFunc(reactFlowWrapper.current.querySelector('.react-flow__viewport') as HTMLElement, {
        backgroundColor: "transparent",
        width: nodesBounds.width,
        height: nodesBounds.height,
        style: {
          width: `${nodesBounds.width}px`,
          height: `${nodesBounds.height}px`,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        },
      });
      
      const link = document.createElement("a");
      link.download = `threat-timeline.${fileType}`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error(`Error exporting ${fileType.toUpperCase()}:`, error);
    }
  }, [getNodes]);

  const handleExportPng = useCallback(() => {
    handleExportImage(toPng, 'png');
  }, [handleExportImage]);

  const handleExportSvg = useCallback(() => {
    handleExportImage(toSvg, 'svg');
  }, [handleExportImage]);

  // Update nodes and edges when events change or saved positions change
  React.useEffect(() => {
    if (events.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }
    const newState = calculateLayout(events);
    console.log('New state from calculateLayout:', newState);
    
    if (savedPositions) {
      newState.nodes = newState.nodes.map(node => ({
        ...node,
        position: savedPositions[node.id] || node.position
      }));
    }
    
    setNodes(newState.nodes);
    setEdges(newState.edges);
  }, [events, savedPositions, setNodes, setEdges]);

  // Handle node changes and update parent with new positions
  const handleNodesChange = useCallback((changes: any[]) => {
    onNodesChange(changes);
    
    const dragChange = changes.find(change => change.type === 'position' && change.dragging === false);
    if (dragChange && onPositionsChange) {
      const newPositions = nodes.reduce((acc, node) => {
        acc[node.id] = node.position;
        return acc;
      }, {} as Record<string, XYPosition>);
      onPositionsChange(newPositions);
    }
  }, [nodes, onNodesChange, onPositionsChange]);

  return (
    <div className="relative h-[800px] border rounded-md bg-background">
      <div ref={reactFlowWrapper} className="h-full">
        <style>
          {`
            @keyframes dashdraw {
              from {
                stroke-dashoffset: 10;
              }
              to {
                stroke-dashoffset: 0;
              }
            }
          `}
        </style>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={handleNodeDragStop}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{
            type: 'default'
          }}
          fitView
        >
          <Panel position="top-right" className="bg-background/95 p-2 rounded-lg shadow-lg">
            <ActionButtons
              page="visualization"
              onResetLayout={onResetRequest}
              onExportPng={handleExportPng}
              onExportSvg={handleExportSvg}
            />
          </Panel>
          <Background />
          <Controls className="bg-background/95 border-border" />
          <MiniMap 
            className="bg-background/95 !border-border"
            nodeColor="hsl(var(--muted))"
            maskColor="hsl(var(--background)/50)"
          />
        </ReactFlow>
      </div>
    </div>
  );
};

export const Visualization: React.FC<VisualizationProps> = (props) => {
  return (
    <div style={{ height: '800px' }} className="w-full border rounded-lg bg-background/50 backdrop-blur">
      <ReactFlowProvider>
        <Flow {...props} />
      </ReactFlowProvider>
    </div>
  );
};

export default Visualization;