export type Difficulty = 'easy' | 'medium' | 'hard' | 'extreme';
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
    description: '5 pegs  |  6 attempts',
    hasFakeFeedback: false,
  },
  hard: {
    label: 'Hard',
    codeLength: 6,
    maxAttempts: 5,
    colorCount: 6,
    hintTokens: 0,
    description: '6 pegs  |  5 attempts',
    hasFakeFeedback: false,
  },
  extreme: {
    label: 'Extreme',
    codeLength: 7,
    maxAttempts: 4,
    colorCount: 6,
    hintTokens: 0,
    description: '7 pegs  |  4 attempts  |  1 fake pin',
    hasFakeFeedback: true,
  },
};

export const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard', 'extreme'];

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

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'consumable' | 'unlock' | 'pins' | 'background';
  icon: string;
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'hint', name: 'Hint Token', description: 'Reveals one correct peg', price: 30, category: 'consumable', icon: 'bulb-outline' },
  { id: 'shield', name: 'Streak Shield', description: 'Protects your streak once', price: 40, category: 'consumable', icon: 'shield-checkmark-outline' },
  { id: 'extreme', name: 'Extreme Mode', description: '7 pegs · 4 tries · 1 fake pin', price: 250, category: 'unlock', icon: 'skull-outline' },
  { id: 'pins_neon', name: 'Neon Glow', description: 'Glowing neon feedback pins', price: 120, category: 'pins', icon: 'flash-outline' },
  { id: 'pins_crystal', name: 'Crystal', description: 'Sparkling crystal pins', price: 180, category: 'pins', icon: 'diamond-outline' },
  { id: 'bg_default', name: 'Default', description: 'Classic dark theme — always free', price: 0, category: 'background', icon: 'contrast-outline' },
  { id: 'bg_midnight', name: 'Midnight', description: 'Deep space with distant stars', price: 80, category: 'background', icon: 'moon-outline' },
  { id: 'bg_ocean', name: 'Deep Ocean', description: 'Dark teal abyss gradient', price: 80, category: 'background', icon: 'water-outline' },
  { id: 'bg_nebula', name: 'Nebula', description: 'Cosmic purple nebula glow', price: 100, category: 'background', icon: 'planet-outline' },
  { id: 'bg_ember', name: 'Ember', description: 'Deep crimson fire glow', price: 80, category: 'background', icon: 'flame-outline' },
  { id: 'bg_aurora', name: 'Aurora', description: 'Stylish northern lights — cool & elegant', price: 120, category: 'background', icon: 'sparkles-outline' },
  { id: 'bg_marble', name: 'Marble', description: 'Classy black and gold marble luxury', price: 150, category: 'background', icon: 'layers-outline' },
  { id: 'bg_bauhaus', name: 'Bauhaus', description: 'Arty geometric bold colour blocks', price: 150, category: 'background', icon: 'shapes-outline' },
  { id: 'bg_neon_city', name: 'Neon City', description: 'Crazy cyberpunk neon explosion', price: 150, category: 'background', icon: 'business-outline' },
  { id: 'bg_void', name: 'Void', description: 'Ultra stylish deep black with violet edge', price: 200, category: 'background', icon: 'radio-button-on-outline' },
];

export const SHOP_CATEGORIES = [
  { key: 'consumable', label: 'CONSUMABLES' },
  { key: 'unlock', label: 'UNLOCKS' },
  { key: 'pins', label: 'PIN STYLES' },
  { key: 'background', label: 'BACKGROUNDS' },
] as const;
