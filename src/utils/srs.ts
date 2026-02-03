import dayjs from 'dayjs';

/**
 * SRS (Spaced Repetition System) data structure for tracking learning progress.
 * Uses the SM2 algorithm to schedule reviews based on performance.
 */
export interface SRSData {
  /** Number of successful repetitions */
  repetitions: number;
  /** Easiness factor (starts at 2.5, adjusts based on performance) */
  easiness_factor: number;
  /** Current interval in days between reviews */
  interval: number;
  /** ISO date string of last review, null if never reviewed */
  last_reviewed: string | null;
  /** ISO date string of next scheduled review, null if never reviewed */
  next_review: string | null;
}

/**
 * SM2 Spaced Repetition Algorithm implementation.
 *
 * The SM2 algorithm is a widely-used spaced repetition system that:
 * - Increases intervals between reviews as mastery improves
 * - Adjusts difficulty based on user performance (quality ratings)
 * - Uses an easiness factor that evolves with learning progress
 *
 * Quality ratings: 0 (complete blackout) to 5 (perfect response)
 */
export class SM2 {
  /**
   * Updates SRS data based on user performance quality.
   *
   * @param data - The current SRS data to update
   * @param quality - Performance quality (0-5), where:
   *   - 0: Complete blackout, wrong answer
   *   - 1-2: Incorrect, but remembered on seeing answer
   *   - 3-5: Correct answer (3=difficult, 4=easy, 5=perfect)
   */
  static update(data: SRSData, quality: number): void {
    const q = quality;

    if (q >= 3) {
      // Success: Increase interval and repetitions
      if (data.repetitions === 0) {
        data.interval = 1; // First success: review tomorrow
      } else if (data.repetitions === 1) {
        data.interval = 6; // Second success: review in 6 days
      } else {
        // Subsequent successes: multiply by easiness factor
        data.interval = Math.round(data.interval * data.easiness_factor);
      }
      data.repetitions += 1;
    } else {
      // Failure: Reset to beginning
      data.repetitions = 0;
      data.interval = 1; // Review tomorrow
    }

    // Update easiness factor based on quality
    // Formula: EF = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
    data.easiness_factor = data.easiness_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (data.easiness_factor < 1.3) {
      data.easiness_factor = 1.3; // Minimum easiness factor
    }

    // Update timestamps
    const now = dayjs();
    data.last_reviewed = now.toISOString();
    data.next_review = now.add(data.interval, 'day').toISOString();
  }

  /**
   * Calculates the mastery score change based on review quality.
   *
   * @param current - Current mastery score (0.0 to 1.0)
   * @param quality - Review quality (0-5)
   * @returns The delta to add to current mastery score
   */
  static calculateMasteryDelta(current: number, quality: number): number {
    const q = quality;
    // Linear mapping: quality 5 → +0.15, quality 0 → -0.45
    if (q >= 3) {
      return (q - 2) * 0.05; // Max +0.15 for perfect recall
    } else {
      return (q - 3) * 0.15; // Max -0.45 for complete failure
    }
  }
}