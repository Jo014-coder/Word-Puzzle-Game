import { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { Difficulty, DIFFICULTY_CONFIG, WIN_MESSAGES } from '@/constants/game';
import Colors from '@/constants/colors';

export interface PegSlot {
  colorIndex: number | null;
}

export interface Feedback {
  exact: number;
  misplaced: number;
}

export interface GuessRow {
  pegs: PegSlot[];
  feedback: Feedback | null;
  revealed: boolean;
}

interface SaveData {
  streak: number;
  coins: number;
  hintTokens: number;
  streakShield: boolean;
  gamesPlayed: number;
  gamesWon: number;
}

interface GameState {
  phase: 'menu' | 'playing' | 'won' | 'lost';
  difficulty: Difficulty | null;
  secretCode: number[];
  rows: GuessRow[];
  currentRow: number;
  selectedSlot: number;
  streak: number;
  coins: number;
  hintTokens: number;
  streakShield: boolean;
  gamesPlayed: number;
  gamesWon: number;
  toastMessage: string | null;
  toastType: 'info' | 'success' | 'error' | 'milestone';
  showConfetti: boolean;
  shakeRow: number | null;
  revealingRow: number | null;
}

interface GameContextValue extends GameState {
  selectDifficulty: (d: Difficulty) => void;
  selectColor: (colorIndex: number) => void;
  selectSlot: (slotIndex: number) => void;
  clearSlot: () => void;
  submitGuess: () => void;
  playAgain: () => void;
  backToMenu: () => void;
  useHint: () => void;
  clearToast: () => void;
  clearShake: () => void;
  finishReveal: () => void;
  getConfig: () => typeof DIFFICULTY_CONFIG.easy | null;
}

const STORAGE_KEY = 'griddl_mastermind_save';

const GameContext = createContext<GameContextValue | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

function generateSecret(config: typeof DIFFICULTY_CONFIG.easy): number[] {
  const code: number[] = [];
  const available = Array.from({ length: config.colorCount }, (_, i) => i);

  for (let i = 0; i < config.sequenceLength; i++) {
    if (config.allowDuplicates) {
      code.push(Math.floor(Math.random() * config.colorCount));
    } else {
      const idx = Math.floor(Math.random() * available.length);
      code.push(available[idx]);
      available.splice(idx, 1);
    }
  }
  return code;
}

function computeFeedback(guess: number[], secret: number[]): Feedback {
  let exact = 0;
  const secretRemaining: (number | null)[] = [...secret];
  const guessRemaining: (number | null)[] = [...guess];

  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === secret[i]) {
      exact++;
      secretRemaining[i] = null;
      guessRemaining[i] = null;
    }
  }

  let misplaced = 0;
  for (let i = 0; i < guessRemaining.length; i++) {
    if (guessRemaining[i] === null) continue;
    const idx = secretRemaining.indexOf(guessRemaining[i]!);
    if (idx !== -1) {
      misplaced++;
      secretRemaining[idx] = null;
    }
  }

  return { exact, misplaced };
}

function createEmptyRows(config: typeof DIFFICULTY_CONFIG.easy): GuessRow[] {
  return Array.from({ length: config.maxAttempts }, () => ({
    pegs: Array.from({ length: config.sequenceLength }, () => ({ colorIndex: null })),
    feedback: null,
    revealed: false,
  }));
}

async function loadSave(): Promise<SaveData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { streak: 0, coins: 0, hintTokens: 1, streakShield: false, gamesPlayed: 0, gamesWon: 0 };
}

async function persistSave(data: SaveData) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

const haptic = (type: 'light' | 'success' | 'error' | 'warning') => {
  if (Platform.OS === 'web') return;
  switch (type) {
    case 'light': Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); break;
    case 'success': Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); break;
    case 'error': Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); break;
    case 'warning': Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); break;
  }
};

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>({
    phase: 'menu',
    difficulty: null,
    secretCode: [],
    rows: [],
    currentRow: 0,
    selectedSlot: 0,
    streak: 0,
    coins: 0,
    hintTokens: 1,
    streakShield: false,
    gamesPlayed: 0,
    gamesWon: 0,
    toastMessage: null,
    toastType: 'info',
    showConfetti: false,
    shakeRow: null,
    revealingRow: null,
  });

  useEffect(() => {
    loadSave().then(save => {
      setState(prev => ({ ...prev, ...save }));
    });
  }, []);

  const getConfig = useCallback(() => {
    if (!state.difficulty) return null;
    return DIFFICULTY_CONFIG[state.difficulty];
  }, [state.difficulty]);

  const selectDifficulty = useCallback((d: Difficulty) => {
    const config = DIFFICULTY_CONFIG[d];
    const secret = generateSecret(config);
    const rows = createEmptyRows(config);
    haptic('light');

    loadSave().then(save => {
      setState(prev => ({
        ...prev,
        phase: 'playing',
        difficulty: d,
        secretCode: secret,
        rows,
        currentRow: 0,
        selectedSlot: 0,
        toastMessage: null,
        showConfetti: false,
        shakeRow: null,
        revealingRow: null,
        ...save,
      }));
    });
  }, []);

  const selectSlot = useCallback((slotIndex: number) => {
    haptic('light');
    setState(prev => {
      if (prev.phase !== 'playing') return prev;
      return { ...prev, selectedSlot: slotIndex };
    });
  }, []);

  const selectColor = useCallback((colorIndex: number) => {
    haptic('light');
    setState(prev => {
      if (prev.phase !== 'playing') return prev;
      const newRows = prev.rows.map((r, ri) => {
        if (ri !== prev.currentRow) return r;
        return {
          ...r,
          pegs: r.pegs.map((p, pi) => pi === prev.selectedSlot ? { colorIndex } : p),
        };
      });
      const config = DIFFICULTY_CONFIG[prev.difficulty!];
      const nextSlot = Math.min(prev.selectedSlot + 1, config.sequenceLength - 1);
      return { ...prev, rows: newRows, selectedSlot: nextSlot };
    });
  }, []);

  const clearSlot = useCallback(() => {
    haptic('light');
    setState(prev => {
      if (prev.phase !== 'playing') return prev;
      const newRows = prev.rows.map((r, ri) => {
        if (ri !== prev.currentRow) return r;
        return {
          ...r,
          pegs: r.pegs.map((p, pi) => pi === prev.selectedSlot ? { colorIndex: null } : p),
        };
      });
      return { ...prev, rows: newRows };
    });
  }, []);

  const submitGuess = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'playing' || !prev.difficulty) return prev;
      const config = DIFFICULTY_CONFIG[prev.difficulty];
      const currentPegs = prev.rows[prev.currentRow].pegs;

      if (currentPegs.some(p => p.colorIndex === null)) {
        haptic('warning');
        return { ...prev, shakeRow: prev.currentRow, toastMessage: 'Fill all slots', toastType: 'error' as const };
      }

      const guess = currentPegs.map(p => p.colorIndex!);
      const feedback = computeFeedback(guess, prev.secretCode);

      const newRows = prev.rows.map((r, ri) => {
        if (ri !== prev.currentRow) return r;
        return { ...r, feedback, revealed: true };
      });

      const isWin = feedback.exact === config.sequenceLength;
      const isLastAttempt = prev.currentRow >= config.maxAttempts - 1;

      if (isWin) {
        haptic('success');
        const newStreak = prev.streak + 1;
        const coinReward = 20 + newStreak * 5;
        let bonusCoins = 0;
        let milestoneMsg: string | null = null;
        let newHintTokens = prev.hintTokens;
        let newShield = prev.streakShield;

        if (newStreak === 3) { bonusCoins = 50; milestoneMsg = 'Streak 3 bonus: +50 coins!'; }
        if (newStreak === 5) { newHintTokens++; milestoneMsg = 'Streak 5: Hint token earned!'; }
        if (newStreak === 10) { newShield = true; milestoneMsg = 'Streak 10: Shield unlocked!'; }
        if (newStreak === 15) { milestoneMsg = 'Streak 15: Master Cracker!'; }

        const newCoins = prev.coins + coinReward + bonusCoins;
        const attemptMsg = WIN_MESSAGES[Math.min(prev.currentRow, WIN_MESSAGES.length - 1)];
        const newGamesWon = prev.gamesWon + 1;
        const newGamesPlayed = prev.gamesPlayed + 1;

        const saveData: SaveData = {
          streak: newStreak, coins: newCoins, hintTokens: newHintTokens,
          streakShield: newShield, gamesPlayed: newGamesPlayed, gamesWon: newGamesWon,
        };
        persistSave(saveData);

        return {
          ...prev,
          rows: newRows,
          revealingRow: prev.currentRow,
          phase: 'won' as const,
          streak: newStreak,
          coins: newCoins,
          hintTokens: newHintTokens,
          streakShield: newShield,
          gamesPlayed: newGamesPlayed,
          gamesWon: newGamesWon,
          toastMessage: milestoneMsg || attemptMsg,
          toastType: milestoneMsg ? 'milestone' as const : 'success' as const,
          showConfetti: true,
        };
      }

      if (isLastAttempt) {
        haptic('error');
        let newStreak = 0;
        let newShield = prev.streakShield;
        let loseMsg = 'Game over! Check the code above.';

        if (prev.streakShield) {
          newShield = false;
          newStreak = prev.streak;
          loseMsg = 'Shield saved your streak!';
        }

        const newGamesPlayed = prev.gamesPlayed + 1;
        const saveData: SaveData = {
          streak: newStreak, coins: prev.coins, hintTokens: prev.hintTokens,
          streakShield: newShield, gamesPlayed: newGamesPlayed, gamesWon: prev.gamesWon,
        };
        persistSave(saveData);

        return {
          ...prev,
          rows: newRows,
          revealingRow: prev.currentRow,
          phase: 'lost' as const,
          streak: newStreak,
          streakShield: newShield,
          gamesPlayed: newGamesPlayed,
          toastMessage: loseMsg,
          toastType: prev.streakShield ? 'milestone' as const : 'error' as const,
        };
      }

      haptic('light');

      let nearMissMsg: string | null = null;
      const wrongCount = config.sequenceLength - feedback.exact;
      if (wrongCount === 1) nearMissMsg = 'So close!';
      else if (wrongCount === 2 && feedback.misplaced >= 1) nearMissMsg = 'Almost there!';

      return {
        ...prev,
        rows: newRows,
        revealingRow: prev.currentRow,
        currentRow: prev.currentRow + 1,
        selectedSlot: 0,
        toastMessage: nearMissMsg,
        toastType: 'info' as const,
      };
    });
  }, []);

  const playAgain = useCallback(() => {
    if (!state.difficulty) return;
    const config = DIFFICULTY_CONFIG[state.difficulty];
    const secret = generateSecret(config);
    const rows = createEmptyRows(config);
    haptic('light');
    setState(prev => ({
      ...prev,
      phase: 'playing',
      secretCode: secret,
      rows,
      currentRow: 0,
      selectedSlot: 0,
      toastMessage: null,
      showConfetti: false,
      shakeRow: null,
      revealingRow: null,
    }));
  }, [state.difficulty]);

  const backToMenu = useCallback(() => {
    haptic('light');
    setState(prev => ({
      ...prev,
      phase: 'menu',
      difficulty: null,
      secretCode: [],
      rows: [],
      currentRow: 0,
      selectedSlot: 0,
      toastMessage: null,
      showConfetti: false,
      shakeRow: null,
      revealingRow: null,
    }));
  }, []);

  const useHint = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'playing' || prev.hintTokens <= 0 || !prev.difficulty) return prev;
      const config = DIFFICULTY_CONFIG[prev.difficulty];

      const unrevealedIndices: number[] = [];
      for (let i = 0; i < config.sequenceLength; i++) {
        const alreadyKnown = prev.rows.some(
          (row, ri) => ri < prev.currentRow && row.feedback && row.pegs[i].colorIndex === prev.secretCode[i]
        );
        if (!alreadyKnown) unrevealedIndices.push(i);
      }

      if (unrevealedIndices.length === 0) return prev;

      const hintIdx = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
      const hintColor = prev.secretCode[hintIdx];

      const newRows = prev.rows.map((r, ri) => {
        if (ri !== prev.currentRow) return r;
        return {
          ...r,
          pegs: r.pegs.map((p, pi) => pi === hintIdx ? { colorIndex: hintColor } : p),
        };
      });

      const newHintTokens = prev.hintTokens - 1;
      haptic('success');

      const saveData: SaveData = {
        streak: prev.streak, coins: prev.coins, hintTokens: newHintTokens,
        streakShield: prev.streakShield, gamesPlayed: prev.gamesPlayed, gamesWon: prev.gamesWon,
      };
      persistSave(saveData);

      return {
        ...prev,
        rows: newRows,
        hintTokens: newHintTokens,
        toastMessage: `Hint: Position ${hintIdx + 1} revealed!`,
        toastType: 'info' as const,
      };
    });
  }, []);

  const clearToast = useCallback(() => {
    setState(prev => ({ ...prev, toastMessage: null }));
  }, []);

  const clearShake = useCallback(() => {
    setState(prev => ({ ...prev, shakeRow: null }));
  }, []);

  const finishReveal = useCallback(() => {
    setState(prev => ({ ...prev, revealingRow: null }));
  }, []);

  const value = useMemo(() => ({
    ...state,
    selectDifficulty,
    selectColor,
    selectSlot,
    clearSlot,
    submitGuess,
    playAgain,
    backToMenu,
    useHint,
    clearToast,
    clearShake,
    finishReveal,
    getConfig,
  }), [state, selectDifficulty, selectColor, selectSlot, clearSlot, submitGuess, playAgain, backToMenu, useHint, clearToast, clearShake, finishReveal, getConfig]);

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}
