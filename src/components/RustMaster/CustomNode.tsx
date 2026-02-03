import React from 'react';
import { Handle, Position } from 'reactflow';
import { CheckCircle2, Lock } from 'lucide-react';

interface CurriculumNode {
  slug: string;
  name: string;
  description: string;
  bridge_analogies: string;
  prerequisites: string[];
}

interface AtomicConcept {
  id: string;
  name: string;
  slug: string;
  description: string;
  bridge_analogies: string;
  mastery_score: number;
  srs_data: SRSData;
}

interface SRSData {
  repetitions: number;
  easiness_factor: number;
  interval: number;
  last_reviewed: string | null;
  next_review: string | null;
}

interface UserState {
  conceptual_progress: Record<string, AtomicConcept>;
}

/**
 * Status of a curriculum node in the knowledge graph.
 */
type NodeStatus = 'locked' | 'available' | 'mastered';

/**
 * Props for the CustomNode component.
 */
interface CustomNodeProps {
  /** Node data containing curriculum info and current learning state */
  data: CurriculumNode & { state: { status: NodeStatus; mastery: number } };
}

const getStatusColor = (status: NodeStatus) => {
  switch (status) {
    case 'mastered': return 'border-emerald-500 bg-emerald-500/10 text-emerald-400';
    case 'available': return 'border-blue-500 bg-blue-500/10 text-blue-400';
    case 'locked': return 'border-zinc-700 bg-zinc-800 text-zinc-500';
  }
};

const getCategoryColor = (cat: string) => {
  switch(cat) {
    case 'ownership': return 'text-orange-400';
    case 'borrowing': return 'text-purple-400';
    case 'structs': return 'text-blue-400';
    default: return 'text-zinc-400';
  }
};

/**
 * Custom Node Component - Visual representation of curriculum concepts in the knowledge graph.
 *
 * The Custom Node displays individual Rust concepts as nodes in a ReactFlow graph,
 * showing their current mastery status, prerequisites, and progress. Nodes change
 * appearance based on whether they're locked, available, or mastered.
 *
 * Features:
 * - Color-coded status indicators (locked/available/mastered)
 * - Mastery progress bar for unlocked concepts
 * - Category-based color coding (ownership, borrowing, structs)
 * - Interactive hover effects and connection handles
 * - Visual feedback for completion status
 */
export const CustomNode: React.FC<CustomNodeProps> = ({ data }) => {
  const isLocked = data.state.status === 'locked';

  return (
    <div className={`w-64 rounded-lg border-2 p-4 transition-all duration-300 backdrop-blur-md ${getStatusColor(data.state.status)} ${isLocked ? 'opacity-70' : 'shadow-lg shadow-black/50 hover:scale-105 cursor-pointer'}`}>
      {/* ReactFlow connection handle - allows incoming connections */}
      <Handle type="target" position={Position.Top} className="!bg-zinc-400" />

      {/* Header with category and status icon */}
      <div className="flex items-start justify-between mb-2">
        <span className={`text-xs font-mono uppercase tracking-wider ${getCategoryColor('ownership')}`}>
          ownership
        </span>
        {data.state.status === 'mastered' && <CheckCircle2 size={16} className="text-emerald-500" />}
        {data.state.status === 'locked' && <Lock size={16} />}
      </div>

      {/* Concept name and description */}
      <div className="font-bold text-sm mb-1">{data.name}</div>
      <div className="text-xs text-zinc-400 line-clamp-2">{data.description}</div>

      {/* Mastery progress bar - only shown for unlocked concepts */}
      {!isLocked && (
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
            <span>Mastery</span>
            <span>{Math.round(data.state.mastery * 100)}%</span>
          </div>
          <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${data.state.mastery > 0.8 ? 'bg-emerald-500' : 'bg-blue-500'}`}
              style={{ width: `${data.state.mastery * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ReactFlow connection handle - allows outgoing connections */}
      <Handle type="source" position={Position.Bottom} className="!bg-zinc-400" />
    </div>
  );
};