/**
 * Represents a user's progress on a specific atomic concept.
 * Used by the Synthesis Engine to generate contextual prompts.
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
  /** Bridge analogies explaining the concept in other languages */
  bridge_analogies: string;
  /** Current mastery score (0.0 to 1.0) */
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
 * Synthesis Engine - Generates contextual learning challenges and feedback.
 *
 * The Synthesis Engine creates LLM prompts that combine multiple related concepts
 * into cohesive coding challenges. It uses bridge analogies to help developers
 * transitioning from other languages (like Python or C++) understand Rust concepts.
 *
 * Key features:
 * - Generates prompts requiring intersection of multiple concepts
 * - Uses mental model bridging for better understanding
 * - Creates compiler-error driven learning experiences
 * - Provides contextual feedback based on error patterns
 */
export class SynthesisEngine {
  /**
   * Generates a comprehensive prompt for an LLM to create a coding challenge.
   *
   * The generated prompt requires the AI to create a challenge that integrates
   * ALL provided concepts simultaneously, ensuring users must understand
   * their relationships and interactions.
   *
   * @param nodes - Array of 2-3 related atomic concepts to integrate
   * @param targetLanguage - The language the user is transitioning from (default: 'Python')
   * @returns Complete prompt string for LLM consumption
   */
  static generateTripletPrompt(
    nodes: AtomicConcept[],
    targetLanguage: string = 'Python' // or 'C++'
  ): string {
    let prompt = `Act as a Senior Rust Mentor. Create a single, cohesive coding challenge for a developer transitioning from ${targetLanguage} to Rust.\n\n`;

    prompt += "### Concepts to Integrate:\n";
    for (const node of nodes) {
      prompt += `- ${node.name}: ${node.description}\n`;
      prompt += `  Bridge Analogy: ${node.bridge_analogies}\n`;
    }

    prompt += "\n### Requirements:\n";
    prompt += "1. The challenge MUST require the intersection of ALL these concepts to solve correctly.\n";
    prompt += "2. Use the provided Python/C++ analogies to explain WHY Rust handles these specifically.\n";
    prompt += "3. Provide a 'Starting Point' code snippet that is incomplete or has a specific bug related to these concepts.\n";
    prompt += "4. The user should be able to run 'cargo check' to see relevant compiler errors.\n";

    prompt += "\n### Response Format:\n";
    prompt += "Challenge Title: [Title]\n";
    prompt += "Context: [Brief story/motivation using the Bridge]\n";
    prompt += "Task: [Clear instruction]\n";
    prompt += "Code:\n```rust\n[Starter Code]\n```\n";

    return prompt;
  }

  /**
   * Generates a contextual feedback prompt based on a compiler error.
   *
   * Creates a prompt that helps explain compiler errors in terms of the user's
   * background language, using the bridge analogies to provide mental model
   * connections.
   *
   * @param errorCode - The Rust compiler error code (e.g., 'E0382')
   * @param errorMessage - The full compiler error message
   * @param nodes - Related concepts that might help explain the error
   * @returns Prompt string for LLM to generate contextual feedback
   */
  static generateFeedbackPrompt(
    errorCode: string,
    errorMessage: string,
    nodes: AtomicConcept[]
  ): string {
    let prompt = `The user encountered a Rust compiler error: ${errorCode}.\n`;
    prompt += `Error Message: ${errorMessage}\n\n`;
    prompt += "Using the following concepts, explain what went wrong in terms of the user's C++/Python background:\n";

    for (const node of nodes) {
      prompt += `- ${node.name}: ${node.bridge_analogies}\n`;
    }

    return prompt;
  }
}