import { useCallback } from 'react';
import ReactFlow, { 
  ReactFlowProvider, 
  useNodesState, 
  useEdgesState, 
  Node, 
  NodeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { calculateLayout } from './layoutUtils';
import type { TimelineEvent } from '@/pages/Index';

// DefaultNode component
const DefaultNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <div className="p-4 bg-background border rounded-lg shadow-sm">
      <div className="font-medium">{data.tactic}</div>
      <div className="text-sm text-muted-foreground mt-1">
        {new Date(data.timestamp).toLocaleString()}
      </div>
    </div>
  );
};

export const Visualization = ({ events }: { events: TimelineEvent[] }) => {
  const initialLayout = calculateLayout(events);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialLayout.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialLayout.edges);

  const handleReset = useCallback(() => {
    const { nodes: resetNodes, edges: resetEdges } = calculateLayout(events);
    setNodes(resetNodes);
    setEdges(resetEdges);
  }, [events, setNodes, setEdges]);

  return (
    <div style={{ width: '100%', height: '80vh' }}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          nodeTypes={{ default: DefaultNode }}
          defaultEdgeOptions={{
            type: 'straight',
            animated: false,
          }}
          proOptions={{ hideAttribution: true }}
          minZoom={0.1}
          maxZoom={4}
        />
      </ReactFlowProvider>
    </div>
  );
}; 