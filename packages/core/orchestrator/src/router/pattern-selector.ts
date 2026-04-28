import type { CollaborationPattern } from '../decomposer/types.js';

export class PatternSelector {
  selectPattern(taskDescription: string, specCount: number): CollaborationPattern {
    const lower = taskDescription.toLowerCase();

    if (specCount >= 4 || lower.includes('dream-team') || lower.includes('collaborative')) {
      return 'dream-team' as CollaborationPattern;
    }

    if (specCount >= 2 || lower.includes('sequential') || lower.includes('pipeline')) {
      return 'dag' as CollaborationPattern;
    }

    return 'hub-and-spoke' as CollaborationPattern;
  }

  validPatterns(): CollaborationPattern[] {
    return ['hub-and-spoke', 'dag', 'dream-team'] as CollaborationPattern[];
  }
}
