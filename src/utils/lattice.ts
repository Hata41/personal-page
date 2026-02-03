import dayjs from 'dayjs';

/**
 * Represents a single node in the knowledge curriculum graph.
 * Each node is an atomic concept that can be learned independently.
 */
export interface CurriculumNode {
  /** Unique identifier for the concept (URL-friendly) */
  slug: string;
  /** Human-readable name of the concept */
  name: string;
  /** Detailed description of what the concept entails */
  description: string;
  /** Bridge analogies explaining the concept in terms of other languages */
  bridge_analogies: string;
  /** Array of prerequisite concept slugs that must be mastered first */
  prerequisites: string[];
}

/**
 * Complete curriculum structure containing all concepts and their relationships.
 */
export interface Curriculum {
  /** Array of all curriculum nodes forming the knowledge graph */
  nodes: CurriculumNode[];
}

/**
 * Represents a user's progress on a specific atomic concept.
 */
export interface AtomicConcept {
  /** Unique identifier for this concept instance */
  id: string;
  /** Human-readable name */
  name: string;
  /** Slug matching the curriculum node */
  slug: string;
  /** Description of the concept */
  description: string;
  /** Bridge analogies for learning */
  bridge_analogies: string;
  /** Current mastery score (0.0 to 1.0, where 0.8+ is considered "mastered") */
  mastery_score: number;
  /** SRS data for spaced repetition scheduling */
  srs_data: SRSData;
}

/**
 * SRS data structure for tracking review schedules.
 */
export interface SRSData {
  repetitions: number;
  easiness_factor: number;
  interval: number;
  last_reviewed: string | null;
  next_review: string | null;
}

/**
 * User's complete learning state across all concepts.
 */
export interface UserState {
  /** Map of concept slugs to their current progress data */
  conceptual_progress: Record<string, AtomicConcept>;
}

/**
 * Knowledge Lattice - Core graph structure for the Rust learning curriculum.
 *
 * The Knowledge Lattice represents the curriculum as a Directed Acyclic Graph (DAG)
 * where nodes are atomic concepts and edges represent prerequisite relationships.
 * This structure enables:
 * - Intelligent sequencing of learning material
 * - Prerequisites validation
 * - Spaced repetition scheduling based on concept dependencies
 */
export class KnowledgeLattice {
  private curriculum: Curriculum;
  private slugToPrereqs: Map<string, string[]>;

  /**
   * Creates a new Knowledge Lattice from curriculum data.
   *
   * @param curriculum - The complete curriculum structure
   */
  constructor(curriculum: Curriculum) {
    this.curriculum = curriculum;
    this.slugToPrereqs = new Map();

    // Build fast lookup map for prerequisites
    for (const node of curriculum.nodes) {
      this.slugToPrereqs.set(node.slug, node.prerequisites);
    }
  }

  /**
   * Determines if a concept is accessible to the user based on prerequisite mastery.
   *
   * A concept is accessible if ALL of its prerequisites have mastery_score >= 0.8.
   * This ensures users can only practice concepts they have the foundation for.
   *
   * @param slug - The concept slug to check
   * @param state - Current user state
   * @returns true if the concept can be studied, false otherwise
   */
  isAccessible(slug: string, state: UserState): boolean {
    const prereqs = this.slugToPrereqs.get(slug);
    if (!prereqs) return false;

    // Check that all prerequisites are sufficiently mastered
    for (const prereqSlug of prereqs) {
      const parentConcept = state.conceptual_progress[prereqSlug];
      const mastery = parentConcept ? parentConcept.mastery_score : 0;
      if (mastery < 0.8) {
        return false;
      }
    }

    return true;
  }

  /**
   * Returns all concepts that are due for review according to SRS scheduling.
   *
   * Concepts are due if:
   * 1. They have never been reviewed (next_review is null)
   * 2. Their next_review date is today or in the past
   * 3. They are accessible (all prerequisites mastered)
   *
   * @param state - Current user state
   * @returns Array of concept slugs that should be reviewed
   */
  getDueNodes(state: UserState): string[] {
    const now = dayjs();
    return Object.entries(state.conceptual_progress)
      .filter(([slug, concept]) => {
        const nextReview = concept.srs_data.next_review;
        const isNotYetReviewed = !nextReview;
        const isDue = nextReview ? dayjs(nextReview).isBefore(now) || dayjs(nextReview).isSame(now) : true;

        return this.isAccessible(slug, state) && isDue;
      })
      .map(([slug]) => slug);
  }

  /**
   * Exports the knowledge graph to Mermaid format for visualization.
   *
   * Generates a graph TD (top-down) diagram showing prerequisite relationships.
   * Useful for documentation and understanding the curriculum structure.
   *
   * @returns Mermaid diagram string
   */
  toMermaid(): string {
    let output = "graph TD\n";
    for (const node of this.curriculum.nodes) {
      for (const prereq of node.prerequisites) {
        output += `    ${prereq} --> ${node.slug}\n`;
      }
    }
    return output;
  }
}