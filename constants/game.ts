export type Difficulty = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  label: string;
  sequenceLength: number;
  maxAttempts: number;
  colorCount: number;
  allowDuplicates: boolean;
  description: string;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: 'Easy',
    sequenceLength: 4,
    maxAttempts: 10,
    colorCount: 6,
    allowDuplicates: false,
    description: '4 pegs, 6 colors, no repeats',
  },
  medium: {
    label: 'Medium',
    sequenceLength: 4,
    maxAttempts: 8,
    colorCount: 6,
    allowDuplicates: true,
    description: '4 pegs, 6 colors, repeats allowed',
  },
  hard: {
    label: 'Hard',
    sequenceLength: 5,
    maxAttempts: 8,
    colorCount: 8,
    allowDuplicates: true,
    description: '5 pegs, 8 colors, repeats allowed',
  },
};

export const WIN_MESSAGES = [
  'Genius!',
  'Brilliant!',
  'Impressive!',
  'Splendid!',
  'Great!',
  'Nice!',
  'Good job!',
  'Solid!',
  'Close one!',
  'Phew!',
];
