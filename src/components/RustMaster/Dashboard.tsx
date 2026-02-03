import React, { useState, useEffect } from 'react';
import { BookOpen, Trophy, CheckCircle2, ChevronRight } from 'lucide-react';
import { KnowledgeLattice } from '../../utils/lattice';

/**
 * Represents a single node in the knowledge curriculum graph.
 */
interface CurriculumNode {
  slug: string;
  name: string;
  description: string;
  bridge_analogies: string;
  prerequisites: string[];
}

/**
 * Represents a user's progress on a specific atomic concept.
 */
interface AtomicConcept {
  id: string;
  name: string;
  slug: string;
  description: string;
  bridge_analogies: string;
  mastery_score: number;
  srs_data: SRSData;
}

/**
 * SRS data structure for tracking review schedules.
 */
interface SRSData {
  repetitions: number;
  easiness_factor: number;
  interval: number;
  last_reviewed: string | null;
  next_review: string | null;
}

/**
 * Complete curriculum structure containing all concepts.
 */
interface Curriculum {
  nodes: CurriculumNode[];
}

/**
 * User's complete learning state across all concepts.
 */
interface UserState {
  conceptual_progress: Record<string, AtomicConcept>;
}

/**
 * Props for the Dashboard component.
 */
interface DashboardProps {
  /** Complete curriculum structure */
  curriculum: Curriculum;
  /** Current user learning state */
  userState: UserState;
  /** Navigation callback to switch views */
  onNavigate: (view: string) => void;
}

/**
 * Dashboard Component - Main learning overview and SRS queue display.
 *
 * The Dashboard serves as the central hub of the RustMaster application, providing:
 * - Overall mastery statistics and progress visualization
 * - SRS (Spaced Repetition System) queue showing due concepts
 * - Navigation to individual challenge labs
 * - Real-time calculation of accessible and due concepts
 *
 * Key features:
 * - Calculates overall mastery across all concepts
 * - Shows concepts due for review based on SRS scheduling
 * - Displays learning statistics (mastered concepts, total concepts)
 * - Provides intuitive navigation to practice specific concepts
 */
export const Dashboard: React.FC<DashboardProps> = ({ curriculum, userState, onNavigate }) => {
  // State for due concepts (fetched from backend API)
  const [dueNodes, setDueNodes] = useState<string[]>([]);
  const [loadingDue, setLoadingDue] = useState(true);

  // Fetch due nodes from backend API
  useEffect(() => {
    const fetchDueNodes = async () => {
      try {
        console.log('Fetching due nodes...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch('http://localhost:8000/api/srs/due', {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Due nodes fetched:', data);
        setDueNodes(data.due_nodes);
      } catch (error) {
        console.error('Error fetching due nodes:', error);
        // Fallback to local calculation if API fails
        const lattice = new KnowledgeLattice(curriculum);
        const due = lattice.getDueNodes(userState);
        setDueNodes(due);
      } finally {
        setLoadingDue(false);
      }
    };

    fetchDueNodes();
  }, [curriculum, userState]);

  // Get top 3 concepts due for review with their metadata
  const nextUp = dueNodes.slice(0, 3).map(slug => ({
    slug,
    concept: userState.conceptual_progress[slug],
    node: curriculum.nodes.find(n => n.slug === slug)
  })).filter(item => item.node);

  // Calculate overall mastery percentage across all concepts
  const totalMastery = Object.values(userState.conceptual_progress)
    .reduce((sum, concept) => sum + concept.mastery_score, 0) / Object.keys(userState.conceptual_progress).length;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header with welcome message and overall mastery */}
      <header className="mb-12">
        <h1 className="text-3xl font-bold mb-2">Welcome back, Rustacean.</h1>
        <p className="text-zinc-400">Overall mastery: {Math.round(totalMastery * 100)}%</p>
      </header>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Total Mastery Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-zinc-400 font-medium text-sm">Total Mastery</h3>
            <Trophy className="text-yellow-500" size={20} />
          </div>
          <div className="text-4xl font-bold mb-2">{Math.round(totalMastery * 100)}%</div>
          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500" style={{ width: `${totalMastery * 100}%` }} />
          </div>
        </div>

        {/* Concepts Learned Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-zinc-400 font-medium text-sm">Concepts Learned</h3>
            <CheckCircle2 className="text-emerald-500" size={20} />
          </div>
          <div className="text-4xl font-bold mb-2">
            {Object.values(userState.conceptual_progress).filter(c => c.mastery_score >= 0.8).length}
          </div>
          <p className="text-xs text-emerald-400">of {Object.keys(userState.conceptual_progress).length} total</p>
        </div>

        {/* Due for Review Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-zinc-400 font-medium text-sm">Due for Review</h3>
            <BookOpen className="text-blue-500" size={20} />
          </div>
          <div className="text-4xl font-bold mb-2">{dueNodes.length}</div>
          <p className="text-xs text-zinc-500">Ready to practice</p>
        </div>
      </div>

      {/* SRS Queue Section */}
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <BookOpen size={20} className="text-orange-600" />
        Up Next (SRS Queue)
      </h2>

      {/* List of concepts due for review */}
      <div className="space-y-4">
        {nextUp.map(item => (
          <div
            key={item.slug}
            onClick={() => onNavigate(`challenge-${item.slug}`)}
            className="group flex items-center justify-between bg-zinc-900/50 border border-zinc-800 hover:border-orange-600/50 p-4 rounded-lg cursor-pointer transition-all"
          >
            {/* Concept information */}
            <div className="flex items-center gap-4">
              {/* Mastery indicator bar */}
              <div className={`w-2 h-12 rounded-full ${item.concept.mastery_score > 0.8 ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
              <div>
                <h3 className="font-bold group-hover:text-orange-600 transition-colors">{item.node.name}</h3>
                <p className="text-sm text-zinc-400">{item.node.description}</p>
              </div>
            </div>

            {/* Navigation indicator */}
            <div className="flex items-center gap-4 text-sm text-zinc-500">
              <span className="uppercase tracking-widest text-[10px]">concept</span>
              <ChevronRight size={16} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};