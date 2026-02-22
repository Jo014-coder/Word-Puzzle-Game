export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameMode = 'daily' | 'endless' | 'timeAttack';

export interface DifficultyConfig {
  label: string;
  codeLength: number;
  maxAttempts: number;
  colorCount: number;
  hintTokens: number;
  description: string;
  hasFakeFeedback: boolean;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: 'Easy',
    codeLength: 4,
    maxAttempts: 8,
    colorCount: 6,
    hintTokens: 1,
    description: '4 pegs  |  8 attempts  |  1 hint',
    hasFakeFeedback: false,
  },
  medium: {
    label: 'Medium',
    codeLength: 5,
    maxAttempts: 6,
    colorCount: 6,
    hintTokens: 0,
    description: '5 pegs  |  6 attempts  |  no hints',
    hasFakeFeedback: false,
  },
  hard: {
    label: 'Hard',
    codeLength: 6,
    maxAttempts: 5,
    colorCount: 6,
    hintTokens: 0,
    description: '6 pegs  |  5 attempts  |  fake feedback',
    hasFakeFeedback: true,
  },
};

export const WIN_MESSAGES: Record<number, string> = {
  0: 'Genius!',
  1: 'Brilliant!',
  2: 'Impressive!',
  3: 'Splendid!',
  4: 'Great!',
  5: 'Nice!',
  6: 'Solid!',
  7: 'Phew!',
};

export const TIME_ATTACK_DURATION = 60;
export const TIME_ATTACK_BONUS = 8;
