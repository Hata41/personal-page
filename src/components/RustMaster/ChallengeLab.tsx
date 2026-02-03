import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Play, RefreshCw, Terminal as TerminalIcon, Sparkles } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { BridgeCard } from './BridgeCard';

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

interface Curriculum {
  nodes: CurriculumNode[];
}

interface UserState {
  conceptual_progress: Record<string, AtomicConcept>;
}

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
 * Props for the ChallengeLab component.
 */
interface ChallengeLabProps {
  /** Slug of the concept to practice */
  nodeSlug: string;
  /** Callback to close the lab and return to dashboard */
  onClose: () => void;
  /** Complete curriculum structure */
  curriculum: Curriculum;
  /** Current user learning state */
  userState: UserState;
}

/**
 * Challenge Lab Component - Interactive coding environment for practicing Rust concepts.
 *
 * The Challenge Lab provides an immersive coding experience where users practice
 * specific Rust concepts through compiler-driven challenges. It simulates the
 * Rust compiler locally and provides AI-powered assistance for understanding errors.
 *
 * Key features:
 * - Interactive code editor with syntax highlighting simulation
 * - Simulated Rust compiler with success/failure feedback
 * - AI Coach integration using Google Gemini for conceptual help
 * - Bridge analogies to explain concepts in terms of other languages
 * - Real-time terminal output simulation
 *
 * The lab uses a simple heuristic: code containing ".clone()" triggers success,
 * otherwise shows a mock ownership error (E0382).
 */
export const ChallengeLab: React.FC<ChallengeLabProps> = ({ nodeSlug, onClose, curriculum, userState }) => {
  const [code, setCode] = useState(`fn main() {
    let s1 = String::from("hello");
    let s2 = s1;

    // Error expected here!
    println!("{}, world!", s1);
}`);
  const [terminalOutput, setTerminalOutput] = useState<string>('');
  const [isChecking, setIsChecking] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [isAskingAi, setIsAskingAi] = useState(false);

  // Get concept from real data
  const concept = curriculum.nodes.find(n => n.slug === nodeSlug);
  const conceptState = userState.conceptual_progress[nodeSlug];

  const bridgeContext: BridgeContext = {
    fromLang: 'Python',
    concept: concept?.name || 'Unknown',
    mentalShift: concept?.bridge_analogies || "Bridging from your background to Rust concepts.",
    codeComparison: {
      from: `// In Python/C++`,
      to: `// In Rust`
    }
  };

  /**
   * Runs 'cargo check' by calling the backend API.
   *
   * Sends the user's code to the backend server which runs cargo check
   * and returns the compilation result with updated mastery scores.
   */
  const runCheck = async () => {
    setIsChecking(true);
    setTerminalOutput('');
    setAiFeedback(null);

    try {
      console.log('Running cargo check...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for compilation

      const response = await fetch('http://localhost:8000/api/challenge/solve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to check code');
      }

      const result = await response.json();

      if (result.success) {
        setTerminalOutput(result.output);
        // Update local user state with mastery changes
        const updatedUserState = { ...userState };
        for (const [slug, newMastery] of result.updated_mastery) {
          if (updatedUserState.conceptual_progress[slug]) {
            updatedUserState.conceptual_progress[slug].mastery_score = newMastery;
          }
        }
        // Note: In a full implementation, we'd update the parent state here
        // For now, the backend handles persistence
      } else {
        setTerminalOutput(result.output);
      }
    } catch (error) {
      console.error('Error checking code:', error);
      if (error.name === 'AbortError') {
        setTerminalOutput('❌ Request timed out. The compilation is taking too long or the backend is not responding.');
      } else {
        setTerminalOutput('❌ Failed to connect to backend server. Make sure it\'s running on port 8000.');
      }
    } finally {
      setIsChecking(false);
    }
  };

  /**
   * Requests AI assistance for understanding compiler errors.
   *
   * Uses Google Gemini AI to provide contextual explanations of Rust compiler errors,
   * framing them in terms of the user's background programming language (Python/C++).
   */
  const askAICoach = async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setAiFeedback("Missing API Key. Please configure VITE_GEMINI_API_KEY.");
      return;
    }

    setIsAskingAi(true);
    try {
      const ai = new GoogleGenerativeAI({ apiKey });
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const response = await model.generateContent(`Explain the Rust error E0382 in the context of this code: ${code}.
        Keep it brief (max 3 sentences) and use an analogy for a Python developer.
        Format as clear text.`);
      setAiFeedback(response.response.text() || "Could not generate feedback.");
    } catch (e) {
      setAiFeedback("AI Coach is currently offline (API Error).");
    } finally {
      setIsAskingAi(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute inset-0 bg-background z-50 flex flex-col"
    >
      {/* Header with concept info and cargo check button */}
      <div className="h-14 border-b border-border flex items-center justify-between px-6 bg-surface">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white">
            <X size={20} />
          </button>
          <span className="font-mono text-sm text-zinc-500">LAB-{nodeSlug}</span>
          <h2 className="font-bold text-lg">{concept?.name}</h2>
        </div>
        <div className="flex items-center gap-3">
           <button
            onClick={runCheck}
            disabled={isChecking}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isChecking ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
            Cargo Check
          </button>
        </div>
      </div>

      {/* Main Content - Split into context panel and editor/terminal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Learning context and AI assistance */}
        <div className="w-1/3 border-r border-border bg-zinc-900/50 p-6 overflow-y-auto">
          <BridgeCard context={bridgeContext} />

          <div className="mb-6">
            <h3 className="font-bold text-zinc-100 mb-2">The Mission</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Fix the ownership error in the code editor. You want to print `s1` after assigning it to `s2`.
              Consider using <code>.clone()</code> or borrowing explicitly.
            </p>
          </div>

          <div className="bg-blue-900/10 border border-blue-500/20 rounded p-4">
             <div className="flex items-center gap-2 text-blue-400 mb-2">
                <Sparkles size={16} />
                <span className="text-xs font-bold uppercase">AI Coach</span>
             </div>
             {aiFeedback ? (
               <p className="text-sm text-zinc-300 animate-in fade-in">{aiFeedback}</p>
             ) : (
               <p className="text-xs text-zinc-500 italic">Run code to see errors, then ask for help.</p>
             )}
          </div>
        </div>

        {/* Right Panel: Code editor and terminal output */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Code Editor - GitHub Dark theme simulation */}
          <div className="flex-1 relative bg-[#0d1117]">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-full bg-transparent text-zinc-300 font-mono text-sm p-4 resize-none outline-none leading-6"
              spellCheck={false}
            />
            {/* Simple Line Numbers Overlay Mock */}
            <div className="absolute top-4 left-0 bottom-0 w-10 text-right pr-3 text-zinc-700 font-mono text-sm pointer-events-none select-none leading-6">
              {code.split('\n').map((_, i) => <div key={i}>{i + 1}</div>)}
            </div>
          </div>

          {/* Terminal Drawer - Shows compilation output and AI analysis button */}
          <div className="h-64 border-t border-border bg-[#09090b] flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface/50">
              <div className="flex items-center gap-2 text-zinc-400">
                <TerminalIcon size={14} />
                <span className="text-xs font-mono">TERMINAL</span>
              </div>
              {/* AI Analysis button appears after compilation errors */}
              {terminalOutput && !isAskingAi && (
                <button
                  onClick={askAICoach}
                  className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Sparkles size={12} />
                  Analyze Error
                </button>
              )}
            </div>
            {/* Terminal output area - displays compilation results or placeholder */}
            <div className="flex-1 p-4 font-mono text-xs overflow-y-auto text-zinc-300 whitespace-pre-wrap">
              {terminalOutput || <span className="text-zinc-600 italic">Ready for cargo check...</span>}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};