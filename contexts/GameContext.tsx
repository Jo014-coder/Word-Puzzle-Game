import { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRandomWord, isValidWord } from '@/constants/words';
import * as Haptics from 'expo-haptics';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type TileStatus = 'empty' | 'filled' | 'correct' | 'present' | 'absent';

export interface TileData {
  letter: string;
  status: TileStatus;
}

interface DifficultyConfig {
  wordLength: number;
  maxAttempts: number;
  hintTokens: number;
  label: string;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { wordLength: 4, maxAttempts: 8, hintTokens: 1, label: 'Easy' },
  medium: { wordLength: 5, maxAttempts: 6, hintTokens: 0, label: 'Medium' },
  hard: { wordLength: 6, maxAttempts: 5, hintTokens: 0, label: 'Hard' },
};

const WIN_MESSAGES = [
  'Genius!',
  'Magnificent!',
  'Impressive!',
  'Splendid!',
  'Great!',
  'Phew!',
  'Lucky!',
  'Close one!',
];

interface GameState {
  difficulty: Difficulty | null;
  targetWord: string;
  guesses: TileData[][];
  currentRow: number;
  currentCol: number;
  gameOver: boolean;
  won: boolean;
  streak: number;
  coins: number;
  hintTokens: number;
  streakShield: boolean;
  keyboardStatus: Record<string, TileStatus>;
  shakeRow: number | null;
  revealRow: number | null;
  toastMessage: string | null;
  showConfetti: boolean;
  showPlayAgain: boolean;
  milestoneMessage: string | null;
}

interface GameContextValue extends GameState {
  selectDifficulty: (d: Difficulty) => void;
  handleKeyPress: (key: string) => void;
  handleBackspace: () => void;
  handleSubmit: () => void;
  handlePlayAgain: () => void;
  useHint: () => void;
  clearToast: () => void;
  clearShake: () => void;
  clearReveal: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

function createEmptyGrid(rows: number, cols: number): TileData[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ letter: '', status: 'empty' as TileStatus }))
  );
}

function evaluateGuess(guess: string, target: string): TileStatus[] {
  const result: TileStatus[] = Array(guess.length).fill('absent');
  const targetLetters = target.split('');
  const guessLetters = guess.split('');
  const remaining: (string | null)[] = [...targetLetters];

  for (let i = 0; i < guessLetters.length; i++) {
    if (guessLetters[i] === targetLetters[i]) {
      result[i] = 'correct';
      remaining[i] = null;
    }
  }

  for (let i = 0; i < guessLetters.length; i++) {
    if (result[i] === 'correct') continue;
    const idx = remaining.indexOf(guessLetters[i]);
    if (idx !== -1) {
      result[i] = 'present';
      remaining[idx] = null;
    }
  }

  return result;
}

const STORAGE_KEY = 'griddl_save';

interface SaveData {
  streak: number;
  coins: number;
  hintTokens: number;
  streakShield: boolean;
}

async function loadSave(): Promise<SaveData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { streak: 0, coins: 0, hintTokens: 0, streakShield: false };
}

async function savePersist(data: SaveData) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>({
    difficulty: null,
    targetWord: '',
    guesses: [],
    currentRow: 0,
    currentCol: 0,
    gameOver: false,
    won: false,
    streak: 0,
    coins: 0,
    hintTokens: 0,
    streakShield: false,
    keyboardStatus: {},
    shakeRow: null,
    revealRow: null,
    toastMessage: null,
    showConfetti: false,
    showPlayAgain: false,
    milestoneMessage: null,
  });

  useEffect(() => {
    loadSave().then(save => {
      setState(prev => ({ ...prev, ...save }));
    });
  }, []);

  const selectDifficulty = useCallback((d: Difficulty) => {
    const config = DIFFICULTY_CONFIG[d];
    const word = getRandomWord(config.wordLength);
    const grid = createEmptyGrid(config.maxAttempts, config.wordLength);
    loadSave().then(save => {
      setState(prev => ({
        ...prev,
        difficulty: d,
        targetWord: word,
        guesses: grid,
        currentRow: 0,
        currentCol: 0,
        gameOver: false,
        won: false,
        keyboardStatus: {},
        shakeRow: null,
        revealRow: null,
        toastMessage: null,
        showConfetti: false,
        showPlayAgain: false,
        milestoneMessage: null,
        streak: save.streak,
        coins: save.coins,
        hintTokens: save.hintTokens + config.hintTokens,
        streakShield: save.streakShield,
      }));
    });
  }, []);

  const handleKeyPress = useCallback((key: string) => {
    setState(prev => {
      if (prev.gameOver || !prev.difficulty) return prev;
      const config = DIFFICULTY_CONFIG[prev.difficulty];
      if (prev.currentCol >= config.wordLength) return prev;

      const newGuesses = prev.guesses.map(row => row.map(tile => ({ ...tile })));
      newGuesses[prev.currentRow][prev.currentCol] = { letter: key.toUpperCase(), status: 'filled' };

      return { ...prev, guesses: newGuesses, currentCol: prev.currentCol + 1 };
    });
  }, []);

  const handleBackspace = useCallback(() => {
    setState(prev => {
      if (prev.gameOver || !prev.difficulty) return prev;
      if (prev.currentCol <= 0) return prev;

      const newGuesses = prev.guesses.map(row => row.map(tile => ({ ...tile })));
      newGuesses[prev.currentRow][prev.currentCol - 1] = { letter: '', status: 'empty' };

      return { ...prev, guesses: newGuesses, currentCol: prev.currentCol - 1 };
    });
  }, []);

  const handleSubmit = useCallback(() => {
    setState(prev => {
      if (prev.gameOver || !prev.difficulty) return prev;
      const config = DIFFICULTY_CONFIG[prev.difficulty];

      if (prev.currentCol < config.wordLength) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return { ...prev, shakeRow: prev.currentRow, toastMessage: 'Not enough letters' };
      }

      const guessWord = prev.guesses[prev.currentRow].map(t => t.letter).join('');

      if (!isValidWord(guessWord, config.wordLength)) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return { ...prev, shakeRow: prev.currentRow, toastMessage: 'Not in word list' };
      }

      const statuses = evaluateGuess(guessWord, prev.targetWord);
      const newGuesses = prev.guesses.map(row => row.map(tile => ({ ...tile })));

      for (let i = 0; i < statuses.length; i++) {
        newGuesses[prev.currentRow][i] = { letter: guessWord[i], status: statuses[i] };
      }

      const newKeyStatus = { ...prev.keyboardStatus };
      for (let i = 0; i < guessWord.length; i++) {
        const letter = guessWord[i];
        const newStatus = statuses[i];
        const existing = newKeyStatus[letter];
        if (!existing || newStatus === 'correct' || (newStatus === 'present' && existing !== 'correct')) {
          newKeyStatus[letter] = newStatus;
        }
      }

      const isWin = statuses.every(s => s === 'correct');
      const isLastAttempt = prev.currentRow >= config.maxAttempts - 1;

      let wrongCount = statuses.filter(s => s !== 'correct').length;
      let nearMissMsg: string | null = null;
      if (!isWin && !isLastAttempt) {
        if (wrongCount === 1) nearMissMsg = 'So close!';
        else if (wrongCount === 2) nearMissMsg = 'Almost there!';
      }

      if (isWin) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const newStreak = prev.streak + 1;
        const coinReward = 20 + newStreak * 5;
        let bonusCoins = 0;
        let milestoneMsg: string | null = null;
        let newHintTokens = prev.hintTokens;
        let newShield = prev.streakShield;

        if (newStreak === 3) { bonusCoins = 50; milestoneMsg = 'Streak 3 bonus: +50 coins!'; }
        if (newStreak === 5) { newHintTokens++; milestoneMsg = 'Streak 5: Hint token earned!'; }
        if (newStreak === 10) { newShield = true; milestoneMsg = 'Streak 10: Shield unlocked!'; }
        if (newStreak === 15) { milestoneMsg = 'Streak 15: Rare theme unlocked!'; }

        const newCoins = prev.coins + coinReward + bonusCoins;
        const attemptMsg = WIN_MESSAGES[Math.min(prev.currentRow, WIN_MESSAGES.length - 1)];

        const saveData: SaveData = { streak: newStreak, coins: newCoins, hintTokens: newHintTokens, streakShield: newShield };
        savePersist(saveData);

        return {
          ...prev,
          guesses: newGuesses,
          keyboardStatus: newKeyStatus,
          revealRow: prev.currentRow,
          gameOver: true,
          won: true,
          streak: newStreak,
          coins: newCoins,
          hintTokens: newHintTokens,
          streakShield: newShield,
          toastMessage: attemptMsg,
          showConfetti: true,
          milestoneMessage: milestoneMsg,
        };
      }

      if (isLastAttempt) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        let newStreak = 0;
        let newShield = prev.streakShield;
        let loseMsg = `The word was ${prev.targetWord}`;

        if (prev.streakShield) {
          newShield = false;
          newStreak = prev.streak;
          loseMsg = 'Shield saved your streak!';
        }

        const saveData: SaveData = { streak: newStreak, coins: prev.coins, hintTokens: prev.hintTokens, streakShield: newShield };
        savePersist(saveData);

        return {
          ...prev,
          guesses: newGuesses,
          keyboardStatus: newKeyStatus,
          revealRow: prev.currentRow,
          gameOver: true,
          won: false,
          streak: newStreak,
          streakShield: newShield,
          toastMessage: loseMsg,
          currentRow: prev.currentRow + 1,
        };
      }

      return {
        ...prev,
        guesses: newGuesses,
        keyboardStatus: newKeyStatus,
        revealRow: prev.currentRow,
        currentRow: prev.currentRow + 1,
        currentCol: 0,
        toastMessage: nearMissMsg,
      };
    });
  }, []);

  const handlePlayAgain = useCallback(() => {
    if (!state.difficulty) return;
    const config = DIFFICULTY_CONFIG[state.difficulty];
    const word = getRandomWord(config.wordLength);
    const grid = createEmptyGrid(config.maxAttempts, config.wordLength);

    setState(prev => ({
      ...prev,
      targetWord: word,
      guesses: grid,
      currentRow: 0,
      currentCol: 0,
      gameOver: false,
      won: false,
      keyboardStatus: {},
      shakeRow: null,
      revealRow: null,
      toastMessage: null,
      showConfetti: false,
      showPlayAgain: false,
      milestoneMessage: null,
    }));
  }, [state.difficulty]);

  const useHint = useCallback(() => {
    setState(prev => {
      if (prev.hintTokens <= 0 || prev.gameOver || !prev.difficulty) return prev;

      const config = DIFFICULTY_CONFIG[prev.difficulty];
      const unrevealedIndices: number[] = [];

      for (let i = 0; i < config.wordLength; i++) {
        const alreadyCorrect = prev.guesses.some(
          (row, rowIdx) => rowIdx < prev.currentRow && row[i]?.status === 'correct'
        );
        if (!alreadyCorrect) unrevealedIndices.push(i);
      }

      if (unrevealedIndices.length === 0) return prev;

      const hintIdx = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
      const hintLetter = prev.targetWord[hintIdx];

      const newGuesses = prev.guesses.map(row => row.map(tile => ({ ...tile })));
      for (let c = prev.currentCol; c < config.wordLength; c++) {
        if (newGuesses[prev.currentRow][c].letter === '') {
          newGuesses[prev.currentRow][c] = { letter: '', status: 'empty' };
        }
      }

      newGuesses[prev.currentRow][hintIdx] = { letter: hintLetter, status: 'filled' };

      const newHintTokens = prev.hintTokens - 1;
      const saveData: SaveData = {
        streak: prev.streak,
        coins: prev.coins,
        hintTokens: newHintTokens,
        streakShield: prev.streakShield,
      };
      savePersist(saveData);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      return {
        ...prev,
        guesses: newGuesses,
        hintTokens: newHintTokens,
        toastMessage: `Hint: Letter ${hintIdx + 1} is "${hintLetter}"`,
      };
    });
  }, []);

  const clearToast = useCallback(() => {
    setState(prev => ({ ...prev, toastMessage: null, milestoneMessage: null }));
  }, []);

  const clearShake = useCallback(() => {
    setState(prev => ({ ...prev, shakeRow: null }));
  }, []);

  const clearReveal = useCallback(() => {
    setState(prev => {
      const next = { ...prev, revealRow: null };
      if (prev.gameOver) {
        next.showPlayAgain = true;
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({
    ...state,
    selectDifficulty,
    handleKeyPress,
    handleBackspace,
    handleSubmit,
    handlePlayAgain,
    useHint,
    clearToast,
    clearShake,
    clearReveal,
  }), [state, selectDifficulty, handleKeyPress, handleBackspace, handleSubmit, handlePlayAgain, useHint, clearToast, clearShake, clearReveal]);

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}
