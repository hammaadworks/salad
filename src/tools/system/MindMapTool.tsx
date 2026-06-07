import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Node,
  Edge,
  ConnectionLineType,
  Position,
  useReactFlow,
  Panel,
} from 'reactflow';
import dagre from 'dagre';
import { 
  X, 
  HelpCircle, 
  CornerDownRight, 
  GitBranch, 
  Network, 
  Layout,
  Undo2,
  Redo2
} from 'lucide-react';
import 'reactflow/dist/style.css';

// --- Types & Constants ---

interface MindMapToolProps {
  onClose: () => void;
}

const initialNodes: Node[] = [
  {
    id: 'root',
    type: 'input',
    data: { label: 'Main Topic' },
    position: { x: 0, y: 0 },
    style: { 
      background: '#3b82f6', 
      color: 'white', 
      borderRadius: '8px', 
      border: 'none', 
      padding: '10px 20px', 
      fontSize: '16px',
      fontWeight: 'bold',
      width: 150,
      textAlign: 'center'
    },
  },
];

const initialEdges: Edge[] = [];

// --- Layout Helper ---

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: node.width || 150, height: node.height || 50 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? Position.Left : Position.Top;
    node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - (node.width || 150) / 2,
      y: nodeWithPosition.y - (node.height || 50) / 2,
    };

    return node;
  });

  return { nodes: layoutedNodes, edges };
};


// --- Component ---

function MindMapContent({ onClose }: MindMapToolProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { fitView } = useReactFlow();

  // Layout function
  const onLayout = useCallback(
    (direction: 'LR' | 'TB') => {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        nodes,
        edges,
        direction
      );
      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);
      window.requestAnimationFrame(() => fitView());
    },
    [nodes, edges, setNodes, setEdges, fitView]
  );

  // Keyboard Shortcuts Handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
      // Find selected node
      const selectedNode = nodes.find(n => n.selected);

      if (!selectedNode) return;

      if (e.key === 'Tab') {
          e.preventDefault();
          // Add Child
          const newId = `${selectedNode.id}-${Date.now()}`;
          const newNode: Node = {
              id: newId,
              type: 'input', // using 'input' type for now as it's built-in
              data: { label: 'New Topic' },
              position: { x: selectedNode.position.x + 200, y: selectedNode.position.y }, // rough initial pos
              style: { 
                  background: '#ffffff', 
                  color: '#333', 
                  borderRadius: '6px', 
                  border: '1px solid #ddd', 
                  padding: '8px 16px', 
                  width: 120,
                  textAlign: 'center'
              },
          };
          
          const newEdge: Edge = {
              id: `e${selectedNode.id}-${newId}`,
              source: selectedNode.id,
              target: newId,
              type: 'smoothstep',
          };

          setNodes((ns) => ns.concat(newNode).map(n => ({ ...n, selected: n.id === newId }))); // Select new node
          setEdges((es) => es.concat(newEdge));
          
          // Trigger layout after a short delay to allow state update
          setTimeout(() => onLayout('LR'), 10);
      }

      if (e.key === 'Enter') {
          e.preventDefault();
          // Add Sibling (Same Parent)
          // First find incoming edge to find parent
          const parentEdge = edges.find(edge => edge.target === selectedNode.id);
          
          if (parentEdge) {
              const newId = `${parentEdge.source}-${Date.now()}`;
              const newNode: Node = {
                  id: newId,
                  type: 'input',
                  data: { label: 'New Sibling' },
                  position: { x: selectedNode.position.x, y: selectedNode.position.y + 100 },
                  style: { 
                      background: '#ffffff', 
                      color: '#333', 
                      borderRadius: '6px', 
                      border: '1px solid #ddd', 
                      padding: '8px 16px', 
                      width: 120,
                      textAlign: 'center'
                  },
              };

              const newEdge: Edge = {
                  id: `e${parentEdge.source}-${newId}`,
                  source: parentEdge.source,
                  target: newId,
                  type: 'smoothstep',
              };

               setNodes((ns) => ns.concat(newNode).map(n => ({ ...n, selected: n.id === newId })));
               setEdges((es) => es.concat(newEdge));
               setTimeout(() => onLayout('LR'), 10);
          }
      }
      
      if (e.key === 'Backspace' || e.key === 'Delete') {
          setNodes((nds) => nds.filter((node) => !node.selected));
          setEdges((eds) => eds.filter((edge) => {
              const sourceNode = nodes.find(n => n.id === edge.source);
              const targetNode = nodes.find(n => n.id === edge.target);
              return !sourceNode?.selected && !targetNode?.selected;
          }));
      }

  }, [nodes, edges, setNodes, setEdges, onLayout]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle closing
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-white text-zinc-900 flex h-full w-full">
      {/* Sidebar / Tools */}
      <div className="absolute left-4 bottom-4 z-10 flex flex-col gap-2">
        <div className="bg-white rounded-lg shadow-xl border border-zinc-200 p-2 flex flex-col gap-2">
           <p className="text-xs font-semibold text-zinc-400 px-1 mb-1">Structure</p>
           <div className="flex gap-2">
             <button onClick={() => onLayout('LR')} className="p-2 hover:bg-zinc-100 rounded" title="Left to Right">
               <GitBranch className="w-5 h-5" />
             </button>
             <button onClick={() => onLayout('TB')} className="p-2 hover:bg-zinc-100 rounded" title="Top to Bottom">
               <Network className="w-5 h-5" />
             </button>
           </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-xl border border-zinc-200 p-2 flex flex-col gap-2">
           <button className="p-2 hover:bg-zinc-100 rounded text-zinc-600"><Undo2 className="w-5 h-5"/></button>
           <button className="p-2 hover:bg-zinc-100 rounded text-zinc-600"><Redo2 className="w-5 h-5"/></button>
        </div>

        <div className="bg-white rounded-lg shadow-xl border border-zinc-200 p-2 text-center text-xs font-mono">
            100%
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          connectionLineType={ConnectionLineType.SmoothStep}
          fitView
          className="bg-zinc-50"
        >
          <Background color="#ccc" gap={20} />
          <Controls position="bottom-left" style={{ marginBottom: '150px' }} /> 
          
          <Panel position="top-right" className="flex gap-2">
             <button 
               onClick={() => setShowShortcuts(!showShortcuts)}
               className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${showShortcuts ? 'bg-blue-100 text-blue-600' : 'text-zinc-600 hover:bg-zinc-100'}`}
             >
               Shortcuts
             </button>
             <button onClick={onClose} className="p-2 hover:bg-red-50 text-red-500 rounded-full">
               <X className="w-5 h-5" />
             </button>
          </Panel>
        </ReactFlow>
      </div>

      {/* Right Panel: Shortcuts / Guide */}
      {showShortcuts && (
        <div className="w-80 bg-white border-l border-zinc-200 shadow-xl h-full p-6 overflow-y-auto absolute right-0 top-0 bottom-0 z-20">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">Shortcuts</h2>
            <button onClick={() => setShowShortcuts(false)}><X className="w-4 h-4 text-zinc-400" /></button>
          </div>

          <div className="space-y-6">
            <ShortcutGroup title="Common">
              <ShortcutItem icon={<CornerDownRight className="w-4 h-4"/>} label="Insert sibling node" keys={['Enter']} />
              <ShortcutItem icon={<GitBranch className="w-4 h-4"/>} label="Insert child node" keys={['Tab']} />
              <ShortcutItem icon={<Layout className="w-4 h-4"/>} label="Insert parent node" keys={['Shift', 'Tab']} />
              <ShortcutItem icon={<HelpCircle className="w-4 h-4"/>} label="Enter editing mode" keys={['Space']} />
            </ShortcutGroup>

            <ShortcutGroup title="Style">
               <ShortcutItem label="Bold" keys={['Cmd', 'B']} />
               <ShortcutItem label="Italic" keys={['Cmd', 'I']} />
            </ShortcutGroup>

             <ShortcutGroup title="Operation">
               <ShortcutItem label="Copy node" keys={['Cmd', 'C']} />
               <ShortcutItem label="Paste node" keys={['Cmd', 'V']} />
               <ShortcutItem label="Delete" keys={['Backspace']} />
            </ShortcutGroup>
          </div>
        </div>
      )}
    </div>
  );
}

function ShortcutGroup({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-zinc-400 mb-3">{title}</h3>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  )
}

function ShortcutItem({ icon, label, keys }: { icon?: React.ReactNode, label: string, keys: string[] }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-zinc-700">
        {icon && <span className="text-zinc-400">{icon}</span>}
        <span>{label}</span>
      </div>
      <div className="flex gap-1">
        {keys.map(k => (
          <kbd key={k} className="px-1.5 py-0.5 bg-zinc-100 border border-zinc-300 rounded text-xs font-sans text-zinc-500 min-w-[20px] text-center">
            {k}
          </kbd>
        ))}
      </div>
    </div>
  )
}

// Wrap with Provider
export default function MindMapTool(props: MindMapToolProps) {
  return (
    <ReactFlowProvider>
      <MindMapContent {...props} />
    </ReactFlowProvider>
  );
}
