import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Platform, Share } from 'react-native';
import { Difficulty, GameMode, DIFFICULTY_CONFIG, DIFFICULTY_ORDER, WIN_MESSAGES, TIME_ATTACK_DURATION, TIME_ATTACK_BONUS, SHOP_ITEMS } from '@/constants/game';
import Colors from '@/constants/colors';

export interface PegSlot {
  colorIndex: number | null;
}

export type FeedbackPeg = 'green' | 'yellow' | 'grey';

export interface GuessRow {
  pegs: PegSlot[];
  feedback: FeedbackPeg[] | null;
  submitted: boolean;
}

interface DailyGameResult {
  rows: GuessRow[];
  phase: 'won' | 'lost';
  difficulty: string;
  currentRow: number;
  secretCode: number[];
  date: string;
}

interface SaveData {
  streak: number;
  coins: number;
  hintTokens: number;
  streakShield: boolean;
  gamesPlayed: number;
  gamesWon: number;
  lastPlayedDate: string;
  dailyPlayed: Record<string, boolean>;
  consecutiveLosses: number;
  goldPegsUnlocked: boolean;
  obsidianTheme: boolean;
  endlessWinStreak: number;
  dailyHardUnlocked: boolean;
  timeAttackLosses: number;
  lastDailyGame: DailyGameResult | null;
  ownedItems: string[];
  activePinStyle: string;
  activeBackground: string;
  adsRemoved: boolean;
}

const DEFAULT_SAVE: SaveData = {
  streak: 0,
  coins: 0,
  hintTokens: 1,
  streakShield: false,
  gamesPlayed: 0,
  gamesWon: 0,
  lastPlayedDate: '',
  dailyPlayed: {},
  consecutiveLosses: 0,
  goldPegsUnlocked: false,
  obsidianTheme: false,
  endlessWinStreak: 0,
  dailyHardUnlocked: false,
  timeAttackLosses: 0,
  lastDailyGame: null,
  ownedItems: [],
  activePinStyle: 'default',
  activeBackground: 'bg_default',
  adsRemoved: false,
};

export type Screen = 'home' | 'game' | 'result' | 'shop';

export interface GameState {
  screen: Screen;
  gameMode: GameMode | null;
  difficulty: Difficulty | null;
  effectiveDifficulty: Difficulty | null;
  secretCode: number[];
  rows: GuessRow[];
  currentRow: number;
  selectedSlot: number;
  phase: 'playing' | 'won' | 'lost';
  streak: number;
  coins: number;
  hintTokens: number;
  streakShield: boolean;
  gamesPlayed: number;
  gamesWon: number;
  goldPegsUnlocked: boolean;
  obsidianTheme: boolean;
  toastMessage: string | null;
  toastType: 'info' | 'success' | 'error' | 'milestone';
  showConfetti: boolean;
  shakeRow: number | null;
  revealingRow: number | null;
  coinsEarned: number;
  timeLeft: number;
  timeAttackScore: number;
  timeAttackCoins: number;
  isTimerRunning: boolean;
  consecutiveLosses: number;
  hiddenDifficultyReduction: boolean;
  endlessWinStreak: number;
  endlessAutoLevelUp: boolean;
  fakeFeedbackUsed: boolean;
  dailyPlayed: Record<string, boolean>;
  lastPlayedDate: string;
  dailyLoginClaimed: boolean;
  dailyHardUnlocked: boolean;
  timeAttackLosses: number;
  timeAttackNextRows: GuessRow[] | null;
  lastDailyGame: DailyGameResult | null;
  viewingDaily: boolean;
  ownedItems: string[];
  activePinStyle: string;
  activeBackground: string;
  adsRemoved: boolean;
  adPhase: 'none' | 'interstitial' | 'rewarded';
  pendingGameStart: { difficulty: Difficulty; mode: GameMode } | null;
  rewardedAdWatched: boolean;
}

interface GameContextValue extends GameState {
  selectMode: (mode: GameMode) => void;
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
  getConfig: () => typeof DIFFICULTY_CONFIG.easy;
  shareDaily: () => void;
  viewLastDaily: () => void;
  openShop: () => void;
  purchaseItem: (itemId: string) => void;
  dismissAd: () => void;
  requestRewardedAd: () => void;
  completeRewardedAd: () => void;
}

const STORAGE_KEY = 'griddl_v2_save';
const GameContext = createContext<GameContextValue | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function getDailySeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getYesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function generateCode(config: typeof DIFFICULTY_CONFIG.easy, daily: boolean = false): number[] {
  const code: number[] = [];
  if (daily) {
    const rng = seededRandom(getDailySeed() + config.codeLength);
    for (let i = 0; i < config.codeLength; i++) {
      code.push(Math.floor(rng() * config.colorCount));
    }
  } else {
    for (let i = 0; i < config.codeLength; i++) {
      code.push(Math.floor(Math.random() * config.colorCount));
    }
  }
  return code;
}

function computeFeedback(guess: number[], secret: number[], hasFakeFeedback: boolean, alreadyUsedFake: boolean): { feedback: FeedbackPeg[]; fakeUsed: boolean } {
  const result: FeedbackPeg[] = new Array(guess.length).fill('grey');
  const secretPool = [...secret] as (number | null)[];
  const guessPool = [...guess] as (number | null)[];

  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === secret[i]) {
      result[i] = 'green';
      secretPool[i] = null;
      guessPool[i] = null;
    }
  }

  for (let i = 0; i < guess.length; i++) {
    if (guessPool[i] === null) continue;
    const j = secretPool.indexOf(guessPool[i]!);
    if (j !== -1) {
      result[i] = 'yellow';
      secretPool[j] = null;
    }
  }

  let fakeUsed = false;
  const greenIndices = result.reduce<number[]>((acc, v, i) => { if (v === 'green') acc.push(i); return acc; }, []);

  if (hasFakeFeedback && !alreadyUsedFake && greenIndices.length >= 1) {
    const fakeIdx = greenIndices[Math.floor(Math.random() * greenIndices.length)];
    result[fakeIdx] = 'yellow';
    fakeUsed = true;
  }

  return { feedback: result, fakeUsed };
}

function createEmptyRows(config: typeof DIFFICULTY_CONFIG.easy): GuessRow[] {
  return Array.from({ length: config.maxAttempts }, () => ({
    pegs: Array.from({ length: config.codeLength }, () => ({ colorIndex: null })),
    feedback: null,
    submitted: false,
  }));
}

async function loadSave(): Promise<SaveData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SAVE, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_SAVE };
}

async function persistSave(data: Partial<SaveData>) {
  try {
    const existing = await loadSave();
    const merged = { ...existing, ...data };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {}
}

const haptic = (type: 'light' | 'medium' | 'success' | 'error' | 'warning') => {
  if (Platform.OS === 'web') return;
  switch (type) {
    case 'light': Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); break;
    case 'medium': Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); break;
    case 'success': Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); break;
    case 'error': Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); break;
    case 'warning': Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); break;
  }
};

export function GameProvider({ children }: { children: ReactNode }) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [state, setState] = useState<GameState>({
    screen: 'home',
    gameMode: null,
    difficulty: null,
    effectiveDifficulty: null,
    secretCode: [],
    rows: [],
    currentRow: 0,
    selectedSlot: 0,
    phase: 'playing',
    streak: 0,
    coins: 0,
    hintTokens: 1,
    streakShield: false,
    gamesPlayed: 0,
    gamesWon: 0,
    goldPegsUnlocked: false,
    obsidianTheme: false,
    toastMessage: null,
    toastType: 'info',
    showConfetti: false,
    shakeRow: null,
    revealingRow: null,
    coinsEarned: 0,
    timeLeft: TIME_ATTACK_DURATION,
    timeAttackScore: 0,
    timeAttackCoins: 0,
    isTimerRunning: false,
    consecutiveLosses: 0,
    hiddenDifficultyReduction: false,
    endlessWinStreak: 0,
    endlessAutoLevelUp: false,
    fakeFeedbackUsed: false,
    dailyPlayed: {},
    lastPlayedDate: '',
    dailyLoginClaimed: false,
    dailyHardUnlocked: false,
    timeAttackLosses: 0,
    timeAttackNextRows: null,
    lastDailyGame: null,
    viewingDaily: false,
    ownedItems: [],
    activePinStyle: 'default',
    activeBackground: 'bg_default',
    adsRemoved: false,
    adPhase: 'none',
    pendingGameStart: null,
    rewardedAdWatched: false,
  });

  useEffect(() => {
    loadSave().then(save => {
      const today = getTodayKey();
      const claimedToday = save.lastPlayedDate === today;

      const cleanedDaily = { ...(save.dailyPlayed || {}) };
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      let cleaned = false;
      Object.keys(cleanedDaily).forEach(key => {
        const dateStr = key.split('_')[0];
        if (new Date(dateStr) < cutoff) {
          delete cleanedDaily[key];
          cleaned = true;
        }
      });
      if (cleaned) {
        persistSave({ dailyPlayed: cleanedDaily });
      }

      setState(prev => ({
        ...prev,
        streak: save.streak,
        coins: save.coins,
        hintTokens: save.hintTokens,
        streakShield: save.streakShield,
        gamesPlayed: save.gamesPlayed,
        gamesWon: save.gamesWon,
        goldPegsUnlocked: save.goldPegsUnlocked,
        obsidianTheme: save.obsidianTheme,
        consecutiveLosses: save.consecutiveLosses,
        endlessWinStreak: save.endlessWinStreak,
        dailyPlayed: cleanedDaily,
        lastPlayedDate: save.lastPlayedDate,
        dailyLoginClaimed: claimedToday,
        dailyHardUnlocked: save.dailyHardUnlocked || false,
        timeAttackLosses: save.timeAttackLosses || 0,
        lastDailyGame: save.lastDailyGame || null,
        ownedItems: save.ownedItems || [],
        activePinStyle: save.activePinStyle || 'default',
        activeBackground: save.activeBackground || 'bg_default',
        adsRemoved: save.adsRemoved || false,
      }));

      if (!claimedToday && save.lastPlayedDate !== '') {
        const newCoins = save.coins + 3;
        persistSave({ coins: newCoins, lastPlayedDate: today });
        setState(prev => ({
          ...prev,
          coins: newCoins,
          lastPlayedDate: today,
          dailyLoginClaimed: true,
          toastMessage: 'Daily login: +3 coins!',
          toastType: 'milestone',
        }));
      }
    });
  }, []);

  useEffect(() => {
    if (state.isTimerRunning && state.timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setState(prev => {
          if (!prev.isTimerRunning) return prev;
          const newTime = prev.timeLeft - 1;
          if (newTime <= 0) {
            return {
              ...prev,
              timeLeft: 0,
              isTimerRunning: false,
              phase: 'lost',
              screen: 'result',
              toastMessage: `Time's up! Codes solved: ${prev.timeAttackScore}`,
              toastType: 'error',
            };
          }
          return { ...prev, timeLeft: newTime };
        });
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [state.isTimerRunning]);

  const getConfig = useCallback(() => {
    const diff = state.effectiveDifficulty || state.difficulty || 'easy';
    return DIFFICULTY_CONFIG[diff];
  }, [state.effectiveDifficulty, state.difficulty]);

  const startGame = useCallback((difficulty: Difficulty, mode: GameMode, save: SaveData) => {
    let effectiveDiff = difficulty;
    let hiddenReduction = false;

    const lossThreshold = mode === 'timeAttack' ? 2 : 3;
    const losses = mode === 'timeAttack' ? (save.timeAttackLosses || 0) : save.consecutiveLosses;
    if (losses >= lossThreshold && difficulty !== 'easy') {
      const idx = DIFFICULTY_ORDER.indexOf(difficulty);
      effectiveDiff = DIFFICULTY_ORDER[Math.max(0, idx - 1)];
      hiddenReduction = true;
    }

    const config = DIFFICULTY_CONFIG[effectiveDiff];
    const isDaily = mode === 'daily';
    const secret = generateCode(config, isDaily);
    const rows = createEmptyRows(config);
    const isTimeAttack = mode === 'timeAttack';

    setState(prev => ({
      ...prev,
      screen: 'game',
      gameMode: mode,
      difficulty,
      effectiveDifficulty: effectiveDiff,
      secretCode: secret,
      rows,
      currentRow: 0,
      selectedSlot: 0,
      phase: 'playing',
      toastMessage: null,
      showConfetti: false,
      shakeRow: null,
      revealingRow: null,
      coinsEarned: 0,
      fakeFeedbackUsed: false,
      hiddenDifficultyReduction: hiddenReduction,
      endlessAutoLevelUp: false,
      rewardedAdWatched: false,
      timeLeft: isTimeAttack ? TIME_ATTACK_DURATION : 0,
      timeAttackScore: isTimeAttack ? 0 : prev.timeAttackScore,
      timeAttackCoins: isTimeAttack ? 0 : prev.timeAttackCoins,
      isTimerRunning: isTimeAttack,
      streak: save.streak,
      coins: save.coins,
      hintTokens: save.hintTokens + config.hintTokens,
      streakShield: save.streakShield,
      gamesPlayed: save.gamesPlayed,
      gamesWon: save.gamesWon,
      goldPegsUnlocked: save.goldPegsUnlocked,
      obsidianTheme: save.obsidianTheme,
      consecutiveLosses: save.consecutiveLosses,
      endlessWinStreak: save.endlessWinStreak,
    }));
  }, []);

  const launchGameWithAd = useCallback((difficulty: Difficulty, mode: GameMode) => {
    if (state.adsRemoved) {
      loadSave().then(save => startGame(difficulty, mode, save));
    } else {
      setState(prev => ({
        ...prev,
        adPhase: 'interstitial',
        pendingGameStart: { difficulty, mode },
      }));
    }
  }, [state.adsRemoved, startGame]);

  const selectMode = useCallback((mode: GameMode) => {
    haptic('light');
    if (mode === 'daily') {
      const todayKey = getTodayKey();
      const hasPlayedMedium = state.dailyPlayed[`${todayKey}_medium`];
      const hasPlayedHard = state.dailyPlayed[`${todayKey}_hard`];
      const hasPlayed = hasPlayedMedium || hasPlayedHard;

      if (hasPlayed) {
        if (state.lastDailyGame && state.lastDailyGame.date === todayKey) {
          const dg = state.lastDailyGame;
          setState(prev => ({
            ...prev,
            screen: 'game',
            gameMode: 'daily',
            difficulty: dg.difficulty as Difficulty,
            effectiveDifficulty: dg.difficulty as Difficulty,
            phase: dg.phase,
            rows: dg.rows,
            currentRow: dg.currentRow,
            secretCode: dg.secretCode,
            viewingDaily: true,
            showConfetti: false,
          }));
        } else {
          setState(prev => ({
            ...prev,
            toastMessage: 'Already played today! Come back tomorrow.',
            toastType: 'info',
          }));
        }
        return;
      }

      if (state.dailyHardUnlocked) {
        setState(prev => ({ ...prev, gameMode: mode }));
        return;
      }

      launchGameWithAd('medium', mode);
      return;
    }
    setState(prev => ({
      ...prev,
      gameMode: prev.gameMode === mode ? null : mode,
    }));
  }, [state.dailyPlayed, state.dailyHardUnlocked, state.lastDailyGame, launchGameWithAd]);

  const selectDifficulty = useCallback((d: Difficulty) => {
    haptic('medium');
    const mode = state.gameMode || 'endless';

    if (d === 'extreme' && !state.ownedItems.includes('extreme')) {
      setState(prev => ({
        ...prev,
        toastMessage: 'Unlock Extreme Mode in the Shop!',
        toastType: 'info',
      }));
      return;
    }

    if (mode === 'daily') {
      const todayKey = getTodayKey();
      const dailyKey = `${todayKey}_${d}`;
      if (state.dailyPlayed[dailyKey]) {
        setState(prev => ({
          ...prev,
          toastMessage: 'Already played today! Come back tomorrow.',
          toastType: 'info',
        }));
        return;
      }
    }

    launchGameWithAd(d, mode);
  }, [state.gameMode, state.dailyPlayed, state.ownedItems, launchGameWithAd]);

  const selectSlot = useCallback((slotIndex: number) => {
    haptic('light');
    setState(prev => prev.phase !== 'playing' ? prev : { ...prev, selectedSlot: slotIndex });
  }, []);

  const selectColor = useCallback((colorIndex: number) => {
    haptic('light');
    setState(prev => {
      if (prev.phase !== 'playing') return prev;
      const config = DIFFICULTY_CONFIG[prev.effectiveDifficulty || prev.difficulty || 'easy'];
      const newRows = prev.rows.map((r, ri) => {
        if (ri !== prev.currentRow) return r;
        return { ...r, pegs: r.pegs.map((p, pi) => pi === prev.selectedSlot ? { colorIndex } : p) };
      });
      const nextSlot = Math.min(prev.selectedSlot + 1, config.codeLength - 1);
      return { ...prev, rows: newRows, selectedSlot: nextSlot };
    });
  }, []);

  const clearSlot = useCallback(() => {
    haptic('light');
    setState(prev => {
      if (prev.phase !== 'playing') return prev;
      const currentPegs = prev.rows[prev.currentRow].pegs;
      let slotToClear = prev.selectedSlot;
      if (currentPegs[slotToClear].colorIndex === null) {
        let found = -1;
        for (let i = slotToClear - 1; i >= 0; i--) {
          if (currentPegs[i].colorIndex !== null) { found = i; break; }
        }
        if (found === -1) return prev;
        slotToClear = found;
      }
      const newRows = prev.rows.map((r, ri) => {
        if (ri !== prev.currentRow) return r;
        return { ...r, pegs: r.pegs.map((p, pi) => pi === slotToClear ? { colorIndex: null } : p) };
      });
      return { ...prev, rows: newRows, selectedSlot: slotToClear };
    });
  }, []);

  const submitGuess = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'playing') return prev;
      const diff = prev.effectiveDifficulty || prev.difficulty || 'easy';
      const config = DIFFICULTY_CONFIG[diff];
      const currentPegs = prev.rows[prev.currentRow].pegs;

      if (currentPegs.some(p => p.colorIndex === null)) {
        haptic('warning');
        return { ...prev, shakeRow: prev.currentRow, toastMessage: 'Fill all slots first', toastType: 'error' as const };
      }

      const guess = currentPegs.map(p => p.colorIndex!);
      const { feedback, fakeUsed } = computeFeedback(
        guess, prev.secretCode, config.hasFakeFeedback, prev.fakeFeedbackUsed
      );

      const newRows = prev.rows.map((r, ri) => {
        if (ri !== prev.currentRow) return r;
        return { ...r, feedback, submitted: true };
      });

      const realExact = guess.filter((g, i) => g === prev.secretCode[i]).length;
      const isWin = realExact === config.codeLength;
      const isLastAttempt = prev.currentRow >= config.maxAttempts - 1;

      if (isWin) {
        haptic('success');
        const today = getTodayKey();
        const yesterday = getYesterdayKey();
        const lastPlayed = prev.lastPlayedDate;
        const isConsecutiveDay = lastPlayed === yesterday;
        const newStreak = isConsecutiveDay ? prev.streak + 1 : 1;
        let coinReward = Math.min(8 + newStreak * 2, 30);
        let bonusCoins = 0;
        let milestoneMsg: string | null = null;
        let newHintTokens = prev.hintTokens;
        let newShield = prev.streakShield;
        let newGold = prev.goldPegsUnlocked;
        let newObsidian = prev.obsidianTheme;
        let newOwnedItems = [...prev.ownedItems];
        let newActiveBackground = prev.activeBackground;

        let newDailyHard = prev.dailyHardUnlocked;
        if (newStreak >= 2) {
          if (newStreak === 3) { bonusCoins = 15; milestoneMsg = 'Streak 3 bonus: +15 coins!'; }
          else if (newStreak === 5) { newHintTokens++; milestoneMsg = 'Streak 5: Hint token earned!'; }
          else if (newStreak === 7) { newGold = true; milestoneMsg = 'Streak 7: Gold pegs unlocked!'; }
          else if (newStreak === 10) { newShield = true; newDailyHard = true; milestoneMsg = 'Streak 10: Shield + Daily Hard mode unlocked!'; }
          else if (newStreak === 15) {
            newObsidian = true;
            if (!newOwnedItems.includes('bg_obsidian')) newOwnedItems.push('bg_obsidian');
            if (prev.activeBackground === 'bg_default') newActiveBackground = 'bg_obsidian';
            milestoneMsg = 'Streak 15: Obsidian theme unlocked!';
          }
        }

        const isTimeAttack = prev.gameMode === 'timeAttack';
        let comboMultiplier = 1;
        if (isTimeAttack) {
          if (prev.currentRow <= 1) comboMultiplier = 3;
          else if (prev.currentRow <= 2) comboMultiplier = 2;
          coinReward *= comboMultiplier;
        }

        const totalCoinsEarned = coinReward + bonusCoins;
        const newCoins = prev.coins + totalCoinsEarned;
        const newGamesWon = prev.gamesWon + 1;
        const newGamesPlayed = prev.gamesPlayed + 1;
        const attemptMsg = WIN_MESSAGES[Math.min(prev.currentRow, 7)] || 'Well done!';

        let newEndlessWinStreak = prev.gameMode === 'endless' ? prev.endlessWinStreak + 1 : prev.endlessWinStreak;
        let endlessLevelUp = false;
        if (prev.gameMode === 'endless' && newEndlessWinStreak > 0 && newEndlessWinStreak % 3 === 0) {
          endlessLevelUp = true;
        }

        const newDailyPlayed = { ...prev.dailyPlayed };
        if (prev.gameMode === 'daily' && prev.difficulty) {
          newDailyPlayed[`${getTodayKey()}_${prev.difficulty}`] = true;
        }

        const dailyResult: DailyGameResult | null = prev.gameMode === 'daily' ? {
          rows: newRows, phase: 'won', difficulty: prev.difficulty || 'medium',
          currentRow: prev.currentRow, secretCode: prev.secretCode, date: getTodayKey(),
        } : null;

        const saveData: Partial<SaveData> = {
          streak: newStreak, coins: newCoins, hintTokens: newHintTokens,
          streakShield: newShield, gamesPlayed: newGamesPlayed, gamesWon: newGamesWon,
          consecutiveLosses: 0, goldPegsUnlocked: newGold, obsidianTheme: newObsidian,
          endlessWinStreak: newEndlessWinStreak, dailyPlayed: newDailyPlayed,
          lastPlayedDate: getTodayKey(), dailyHardUnlocked: newDailyHard,
          timeAttackLosses: 0, ownedItems: newOwnedItems, activeBackground: newActiveBackground,
          ...(dailyResult ? { lastDailyGame: dailyResult } : {}),
        };
        persistSave(saveData);

        if (isTimeAttack) {
          const newTimeAttackScore = prev.timeAttackScore + 1;
          const newTime = prev.timeLeft + TIME_ATTACK_BONUS;
          const newTimeAttackCoins = prev.timeAttackCoins + totalCoinsEarned;

          const newConfig = DIFFICULTY_CONFIG[prev.effectiveDifficulty || prev.difficulty || 'easy'];
          const newSecret = generateCode(newConfig, false);
          const newEmptyRows = createEmptyRows(newConfig);

          return {
            ...prev,
            rows: newRows,
            revealingRow: prev.currentRow,
            streak: newStreak,
            coins: newCoins,
            hintTokens: newHintTokens,
            streakShield: newShield,
            gamesPlayed: newGamesPlayed,
            gamesWon: newGamesWon,
            goldPegsUnlocked: newGold,
            obsidianTheme: newObsidian,
            consecutiveLosses: 0,
            coinsEarned: totalCoinsEarned,
            timeAttackScore: newTimeAttackScore,
            timeAttackCoins: newTimeAttackCoins,
            timeLeft: newTime,
            endlessWinStreak: newEndlessWinStreak,
            toastMessage: comboMultiplier > 1 ? `${comboMultiplier}x combo! +${totalCoinsEarned}` : `+${totalCoinsEarned} coins`,
            toastType: 'success' as const,
            fakeFeedbackUsed: false,
            secretCode: newSecret,
            currentRow: 0,
            selectedSlot: 0,
            dailyPlayed: newDailyPlayed,
            timeAttackLosses: 0,
            timeAttackNextRows: newEmptyRows,
            dailyHardUnlocked: newDailyHard,
            ownedItems: newOwnedItems,
            activeBackground: newActiveBackground,
          };
        }

        return {
          ...prev,
          rows: newRows,
          revealingRow: prev.currentRow,
          phase: 'won' as const,
          screen: 'result' as const,
          streak: newStreak,
          coins: newCoins,
          hintTokens: newHintTokens,
          streakShield: newShield,
          gamesPlayed: newGamesPlayed,
          gamesWon: newGamesWon,
          goldPegsUnlocked: newGold,
          obsidianTheme: newObsidian,
          consecutiveLosses: 0,
          coinsEarned: totalCoinsEarned,
          toastMessage: milestoneMsg || attemptMsg,
          toastType: milestoneMsg ? 'milestone' as const : 'success' as const,
          showConfetti: true,
          endlessWinStreak: newEndlessWinStreak,
          endlessAutoLevelUp: endlessLevelUp,
          dailyPlayed: newDailyPlayed,
          dailyHardUnlocked: newDailyHard,
          lastDailyGame: dailyResult || prev.lastDailyGame,
          ownedItems: newOwnedItems,
          activeBackground: newActiveBackground,
        };
      }

      if (isLastAttempt) {
        haptic('error');
        let newStreak = 0;
        let newShield = prev.streakShield;
        let loseMsg = 'Game over!';
        let loseType: 'error' | 'milestone' = 'error';

        if (prev.streakShield) {
          newShield = false;
          newStreak = prev.streak;
          loseMsg = 'Shield saved your streak!';
          loseType = 'milestone';
        }

        const newConsecutiveLosses = prev.consecutiveLosses + 1;
        const newGamesPlayed = prev.gamesPlayed + 1;

        const newDailyPlayed = { ...prev.dailyPlayed };
        if (prev.gameMode === 'daily' && prev.difficulty) {
          newDailyPlayed[`${getTodayKey()}_${prev.difficulty}`] = true;
        }

        const dailyLossResult: DailyGameResult | null = prev.gameMode === 'daily' ? {
          rows: newRows, phase: 'lost', difficulty: prev.difficulty || 'medium',
          currentRow: prev.currentRow, secretCode: prev.secretCode, date: getTodayKey(),
        } : null;

        const saveData: Partial<SaveData> = {
          streak: newStreak, coins: prev.coins, hintTokens: prev.hintTokens,
          streakShield: newShield, gamesPlayed: newGamesPlayed, gamesWon: prev.gamesWon,
          consecutiveLosses: newConsecutiveLosses, endlessWinStreak: 0,
          dailyPlayed: newDailyPlayed, lastPlayedDate: getTodayKey(),
          ...(dailyLossResult ? { lastDailyGame: dailyLossResult } : {}),
        };
        persistSave(saveData);

        if (prev.gameMode === 'timeAttack') {
          if (timerRef.current) clearInterval(timerRef.current);
          const newTimeAttackLosses = prev.timeAttackLosses + 1;
          persistSave({ timeAttackLosses: newTimeAttackLosses });
          return {
            ...prev,
            rows: newRows,
            revealingRow: prev.currentRow,
            phase: 'lost' as const,
            screen: 'result' as const,
            streak: newStreak,
            streakShield: newShield,
            consecutiveLosses: newConsecutiveLosses,
            gamesPlayed: newGamesPlayed,
            isTimerRunning: false,
            toastMessage: `Time Attack over! Solved: ${prev.timeAttackScore}`,
            toastType: 'info' as const,
            dailyPlayed: newDailyPlayed,
            endlessWinStreak: 0,
            timeAttackLosses: newTimeAttackLosses,
          };
        }

        return {
          ...prev,
          rows: newRows,
          revealingRow: prev.currentRow,
          phase: 'lost' as const,
          screen: 'result' as const,
          streak: newStreak,
          streakShield: newShield,
          consecutiveLosses: newConsecutiveLosses,
          gamesPlayed: newGamesPlayed,
          toastMessage: loseMsg,
          toastType: loseType as 'error' | 'milestone',
          dailyPlayed: newDailyPlayed,
          endlessWinStreak: 0,
        };
      }

      haptic('light');

      let nearMissMsg: string | null = null;
      const wrongCount = config.codeLength - realExact;
      if (wrongCount === 1) nearMissMsg = 'So close!';
      else if (wrongCount === 2 && feedback.some(f => f === 'yellow')) nearMissMsg = 'Almost there!';

      return {
        ...prev,
        rows: newRows,
        revealingRow: prev.currentRow,
        currentRow: prev.currentRow + 1,
        selectedSlot: 0,
        toastMessage: nearMissMsg,
        toastType: 'info' as const,
        fakeFeedbackUsed: prev.fakeFeedbackUsed || fakeUsed,
      };
    });
  }, []);

  const playAgain = useCallback(() => {
    haptic('light');
    const mode = state.gameMode || 'endless';
    let diff = state.difficulty || 'easy';

    if (mode === 'endless' && state.endlessAutoLevelUp && diff !== 'extreme') {
      const idx = DIFFICULTY_ORDER.indexOf(diff);
      const nextDiff = DIFFICULTY_ORDER[Math.min(idx + 1, DIFFICULTY_ORDER.length - 1)];
      if (nextDiff !== 'extreme' || state.ownedItems.includes('extreme')) {
        diff = nextDiff;
      }
    }

    loadSave().then(save => startGame(diff, mode, save));
  }, [state.gameMode, state.difficulty, state.endlessAutoLevelUp, state.ownedItems, startGame]);

  const backToMenu = useCallback(() => {
    haptic('light');
    if (timerRef.current) clearInterval(timerRef.current);
    setState(prev => ({
      ...prev,
      screen: 'home',
      gameMode: null,
      difficulty: null,
      effectiveDifficulty: null,
      secretCode: [],
      rows: [],
      currentRow: 0,
      selectedSlot: 0,
      phase: 'playing',
      toastMessage: null,
      showConfetti: false,
      shakeRow: null,
      revealingRow: null,
      coinsEarned: 0,
      isTimerRunning: false,
      timeAttackScore: 0,
      timeAttackCoins: 0,
      viewingDaily: false,
    }));
  }, []);

  const useHint = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'playing' || prev.hintTokens <= 0) return prev;
      const diff = prev.effectiveDifficulty || prev.difficulty || 'easy';
      const config = DIFFICULTY_CONFIG[diff];

      const unrevealedIndices: number[] = [];
      for (let i = 0; i < config.codeLength; i++) {
        const alreadyKnown = prev.rows.some(
          (row, ri) => ri < prev.currentRow && row.submitted && row.pegs[i].colorIndex === prev.secretCode[i]
        );
        if (!alreadyKnown) unrevealedIndices.push(i);
      }

      if (unrevealedIndices.length === 0) return prev;

      const hintIdx = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
      const hintColor = prev.secretCode[hintIdx];

      const newRows = prev.rows.map((r, ri) => {
        if (ri !== prev.currentRow) return r;
        return { ...r, pegs: r.pegs.map((p, pi) => pi === hintIdx ? { colorIndex: hintColor } : p) };
      });

      const newHintTokens = prev.hintTokens - 1;
      haptic('success');
      persistSave({ hintTokens: newHintTokens });

      return {
        ...prev,
        rows: newRows,
        hintTokens: newHintTokens,
        toastMessage: `Hint: Position ${hintIdx + 1} revealed!`,
        toastType: 'success' as const,
      };
    });
  }, []);

  const clearToast = useCallback(() => setState(prev => ({ ...prev, toastMessage: null })), []);
  const clearShake = useCallback(() => setState(prev => ({ ...prev, shakeRow: null })), []);
  const finishReveal = useCallback(() => setState(prev => {
    if (prev.timeAttackNextRows) {
      return { ...prev, revealingRow: null, rows: prev.timeAttackNextRows, timeAttackNextRows: null };
    }
    return { ...prev, revealingRow: null };
  }), []);

  const shareDaily = useCallback(() => {
    const game = state.lastDailyGame;
    if (!game && state.gameMode !== 'daily') return;

    const rows = state.rows;
    const won = state.phase === 'won';
    const diff = state.effectiveDifficulty || state.difficulty || 'medium';
    const config = DIFFICULTY_CONFIG[diff];
    const attempts = won ? state.currentRow + 1 : 'X';

    const header = won ? `Solved in ${attempts}/${config.maxAttempts}` : `${config.maxAttempts}/${config.maxAttempts} — not today!`;
    let text = `🎯 Griddl · ${getTodayKey()}\n${header}\n\n`;
    for (let ri = 0; ri < rows.length; ri++) {
      const row = rows[ri];
      if (!row.submitted) continue;
      const pegLine = row.pegs.map(p => p.colorIndex !== null ? Colors.pegEmojis[p.colorIndex] : '⚫').join('');
      const isWinRow = won && ri === (typeof attempts === 'number' ? attempts - 1 : -1);
      text += pegLine + (isWinRow ? ' ✅' : '') + '\n';
    }

    if (Platform.OS === 'web') {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
        setState(prev => ({ ...prev, toastMessage: 'Copied to clipboard!', toastType: 'success' }));
      }
    } else {
      Share.share({ message: text });
    }
  }, [state.lastDailyGame, state.rows, state.phase, state.currentRow, state.effectiveDifficulty, state.difficulty, state.gameMode]);

  const viewLastDaily = useCallback(() => {
    if (!state.lastDailyGame) return;
    const dg = state.lastDailyGame;
    setState(prev => ({
      ...prev,
      screen: 'game',
      gameMode: 'daily',
      difficulty: dg.difficulty as Difficulty,
      effectiveDifficulty: dg.difficulty as Difficulty,
      phase: dg.phase,
      rows: dg.rows,
      currentRow: dg.currentRow,
      secretCode: dg.secretCode,
      viewingDaily: true,
      showConfetti: false,
    }));
  }, [state.lastDailyGame]);

  const openShop = useCallback(() => {
    haptic('light');
    setState(prev => ({ ...prev, screen: 'shop' as Screen }));
  }, []);

  const purchaseItem = useCallback((itemId: string) => {
    haptic('medium');
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    setState(prev => {
      const isConsumable = item.category === 'consumable';
      const alreadyOwned = itemId === 'bg_default' || prev.ownedItems.includes(itemId);

      if (!isConsumable && alreadyOwned) {
        if (item.category === 'pins') {
          const newStyle = prev.activePinStyle === itemId ? 'default' : itemId;
          persistSave({ activePinStyle: newStyle });
          return { ...prev, activePinStyle: newStyle, toastMessage: newStyle === 'default' ? 'Default pins equipped' : `${item.name} equipped!`, toastType: 'success' as const };
        }
        if (item.category === 'background') {
          const newBg = prev.activeBackground === itemId ? 'bg_default' : itemId;
          persistSave({ activeBackground: newBg });
          return { ...prev, activeBackground: newBg, toastMessage: newBg === 'bg_default' ? 'Default background equipped' : `${item.name} equipped!`, toastType: 'success' as const };
        }
        return prev;
      }

      if (prev.coins < item.price) {
        return { ...prev, toastMessage: 'Not enough coins!', toastType: 'error' as const };
      }

      const newCoins = prev.coins - item.price;
      let updates: Partial<GameState> = { coins: newCoins };
      let saveUpdates: Partial<SaveData> = { coins: newCoins };

      if (isConsumable) {
        if (itemId === 'hint') {
          updates.hintTokens = prev.hintTokens + 1;
          saveUpdates.hintTokens = prev.hintTokens + 1;
        } else if (itemId === 'shield') {
          if (prev.streakShield) {
            return { ...prev, toastMessage: 'Shield already active!', toastType: 'info' as const };
          }
          updates.streakShield = true;
          saveUpdates.streakShield = true;
        }
        updates.toastMessage = `${item.name} purchased!`;
        updates.toastType = 'success' as const;
      } else {
        const newOwned = [...prev.ownedItems, itemId];
        updates.ownedItems = newOwned;
        saveUpdates.ownedItems = newOwned;

        if (item.category === 'pins') {
          updates.activePinStyle = itemId;
          saveUpdates.activePinStyle = itemId;
        } else if (item.category === 'background') {
          updates.activeBackground = itemId;
          saveUpdates.activeBackground = itemId;
        }
        updates.toastMessage = `${item.name} unlocked!`;
        updates.toastType = 'milestone' as const;
      }

      persistSave(saveUpdates);
      return { ...prev, ...updates };
    });
  }, []);

  const dismissAd = useCallback(() => {
    const pending = state.pendingGameStart;
    setState(prev => ({ ...prev, adPhase: 'none', pendingGameStart: null }));
    if (pending) {
      loadSave().then(save => startGame(pending.difficulty, pending.mode, save));
    }
  }, [state.pendingGameStart, startGame]);

  const requestRewardedAd = useCallback(() => {
    if (state.rewardedAdWatched) return;
    setState(prev => ({ ...prev, adPhase: 'rewarded' }));
  }, [state.rewardedAdWatched]);

  const completeRewardedAd = useCallback(() => {
    setState(prev => {
      if (prev.adPhase !== 'rewarded') return prev;
      const newCoins = prev.coins + 3;
      persistSave({ coins: newCoins });
      return {
        ...prev,
        coins: newCoins,
        adPhase: 'none',
        rewardedAdWatched: true,
        toastMessage: '+3 coins earned!',
        toastType: 'success' as const,
      };
    });
  }, []);

  const dismissAdOverlay = useCallback(() => {
    if (state.adPhase === 'interstitial') {
      dismissAd();
    } else if (state.adPhase === 'rewarded') {
      setState(prev => ({ ...prev, adPhase: 'none' }));
    }
  }, [state.adPhase, dismissAd]);

  const value = useMemo(() => ({
    ...state,
    selectMode,
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
    shareDaily,
    viewLastDaily,
    openShop,
    purchaseItem,
    dismissAd: dismissAdOverlay,
    requestRewardedAd,
    completeRewardedAd,
  }), [state, selectMode, selectDifficulty, selectColor, selectSlot, clearSlot, submitGuess, playAgain, backToMenu, useHint, clearToast, clearShake, finishReveal, getConfig, shareDaily, viewLastDaily, openShop, purchaseItem, dismissAdOverlay, requestRewardedAd, completeRewardedAd]);

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}
