import React from 'react';
import { Brain, ArrowRightLeft } from 'lucide-react';

/**
 * Context for bridging mental models between languages.
 */
interface BridgeContext {
  fromLang: 'Python' | 'C++';
  concept: string;
  mentalShift: string;
  codeComparison: {
    from: string;
    to: string;
  };
}

/**
 * Props for the BridgeCard component.
 */
interface BridgeCardProps {
  /** Context containing language bridge information and analogies */
  context: BridgeContext;
}

/**
 * Bridge Card Component - Visualizes mental model shifts between programming languages.
 *
 * The Bridge Card helps learners understand Rust concepts by drawing analogies to
 * familiar programming languages like Python or C++. It presents the mental shift
 * required and shows code comparisons to illustrate the differences.
 *
 * Features:
 * - Animated brain icon to represent mental model changes
 * - Side-by-side code comparison showing before/after patterns
 * - Contextual explanations of concept differences
 * - Visual design that emphasizes the "bridge" metaphor
 */
export const BridgeCard: React.FC<BridgeCardProps> = ({ context }) => {
  return (
    <div className="bg-zinc-900 border border-indigo-500/30 rounded-lg p-4 mb-6 relative overflow-hidden group">
      {/* Animated bridge icon in background */}
      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
        <ArrowRightLeft size={64} />
      </div>

      {/* Header with brain icon and title */}
      <div className="flex items-center gap-2 text-indigo-400 mb-3">
        <Brain size={18} />
        <h3 className="font-semibold text-sm tracking-wide uppercase">The Bridge: Mental Shift</h3>
      </div>

      {/* Mental model explanation text */}
      <div className="text-sm text-zinc-300 mb-4 leading-relaxed">
        <span className="text-zinc-500 font-mono text-xs block mb-1">CONTEXT: {context.fromLang} → Rust</span>
        {context.mentalShift}
      </div>

      {/* Side-by-side code comparison */}
      <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-black/40 rounded p-3 border border-zinc-800">
        <div className="border-r border-zinc-800 pr-2">
          <div className="text-red-400 mb-1 opacity-70">In {context.fromLang}:</div>
          <pre className="whitespace-pre-wrap">{context.codeComparison.from}</pre>
        </div>
        <div className="pl-2">
          <div className="text-emerald-400 mb-1 opacity-70">In Rust:</div>
          <pre className="whitespace-pre-wrap">{context.codeComparison.to}</pre>
        </div>
      </div>
    </div>
  );
};