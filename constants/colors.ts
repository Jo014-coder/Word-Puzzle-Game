const Colors = {
  background: '#111827',
  backgroundLight: '#1a2235',
  surface: '#1E2937',
  surfaceLight: '#283548',
  border: '#374151',
  borderLight: '#4B5563',

  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',

  accent: '#6C5CE7',
  accentGlow: '#A29BFE',

  correctPeg: '#16A34A',
  misplacedPeg: '#CA8A04',
  wrongPeg: '#6B7280',

  coin: '#FFD93D',
  streak: '#FF6B6B',
  shield: '#A29BFE',

  overlay: 'rgba(0,0,0,0.8)',

  pegs: [
    '#EF4444',
    '#3B82F6',
    '#EAB308',
    '#22C55E',
    '#A855F7',
    '#F97316',
  ] as string[],

  pegNames: [
    'Red',
    'Blue',
    'Yellow',
    'Green',
    'Purple',
    'Orange',
  ] as string[],

  pegEmojis: ['🔴', '🔵', '🟡', '🟢', '🟣', '🟠'] as string[],

  backgroundThemes: {
    default: '#111827',
    midnight: '#050510',
    ocean: '#041828',
    nebula: '#140520',
    ember: '#1C0805',
    bg_obsidian: '#06060A',
  } as Record<string, string>,

  difficultyColors: {
    easy: '#22C55E',
    medium: '#EAB308',
    hard: '#EF4444',
    extreme: '#A855F7',
  } as Record<string, string>,
};

export default Colors;
