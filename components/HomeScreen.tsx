import { View, Text, Pressable, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  withDelay,
} from 'react-native-reanimated';
import { useEffect, ReactNode, useState } from 'react';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';
import { useGame } from '@/contexts/GameContext';
import { Difficulty, DIFFICULTY_CONFIG, GameMode } from '@/constants/game';
import Toast from './Toast';
import LeaderboardModal from './LeaderboardModal';
import HowToPlayModal from './HowToPlayModal';
import SettingsModal from './SettingsModal';
import ColorPeg from './ColorPeg';
import { LinearGradient } from 'expo-linear-gradient';

const LOGO = ['G', 'R', 'I', 'D', 'D', 'L'];

// The logo: one peg per letter, in the six game colours.
function LogoPeg({ letter, index, size }: { letter: string; index: number; size: number }) {
  const drop = useSharedValue(0);

  useEffect(() => {
    drop.value = withDelay(index * 70, withTiming(1, { duration: 450, easing: Easing.out(Easing.back(1.8)) }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: drop.value,
    transform: [{ translateY: (1 - drop.value) * -18 }, { scale: 0.6 + drop.value * 0.4 }],
  }));

  return (
    <Animated.View style={animStyle}>
      <ColorPeg colorIndex={index} size={size} disabled plain />
      <View style={styles.logoLetterWrap} pointerEvents="none">
        <Text style={[styles.logoLetter, { fontSize: size * 0.46 }]}>{letter}</Text>
      </View>
    </Animated.View>
  );
}

function Logo() {
  const { width } = useWindowDimensions();
  const size = Math.min(52, Math.floor((Math.min(width, 420) - 40 - 5 * 8) / 6));
  return (
    <View style={styles.logoRow} accessibilityRole="header" accessibilityLabel="Griddl">
      {LOGO.map((l, i) => <LogoPeg key={i} letter={l} index={i} size={size} />)}
    </View>
  );
}

const STREAK_REWARDS: { day: number; label: string; icon: string }[] = [
  { day: 3, label: '+15 coins', icon: 'circle-multiple' },
  { day: 5, label: 'Free hint', icon: 'lightbulb-on' },
  { day: 7, label: 'Gold pegs', icon: 'star-circle' },
  { day: 10, label: 'Shield', icon: 'shield-check' },
  { day: 15, label: 'Obsidian', icon: 'image-filter-hdr' },
];

// Shows what the player unlocks by keeping their streak going.
function StreakRewards({ streak }: { streak: number }) {
  const next = STREAK_REWARDS.find(r => r.day > streak);
  return (
    <View style={styles.rewardsCard}>
      <View style={styles.rewardsHeader}>
        <Text style={styles.sectionLabelInline}>STREAK REWARDS</Text>
        <Text style={styles.rewardsNext}>
          {next ? `${next.day - streak} ${next.day - streak === 1 ? 'day' : 'days'} to ${next.label.toLowerCase()}` : 'All unlocked!'}
        </Text>
      </View>
      <View style={styles.rewardsRow}>
        {STREAK_REWARDS.map(r => {
          const done = streak >= r.day;
          const isNext = next?.day === r.day;
          return (
            <View key={r.day} style={styles.rewardItem}>
              <View style={[styles.rewardBubble, done && styles.rewardBubbleDone, isNext && styles.rewardBubbleNext]}>
                <MaterialCommunityIcons
                  name={(done ? 'check-bold' : r.icon) as any}
                  size={18}
                  color={done ? '#111827' : isNext ? Colors.coin : Colors.textMuted}
                />
              </View>
              <Text style={[styles.rewardDay, (done || isNext) && { color: Colors.textPrimary }]}>Day {r.day}</Text>
              <Text style={styles.rewardLabel} numberOfLines={1}>{r.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function useTimeToMidnight() {
  const calc = () => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 0, 0);
    const mins = Math.max(1, Math.round((next.getTime() - now.getTime()) / 60000));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };
  const [label, setLabel] = useState(calc);
  useEffect(() => {
    const t = setInterval(() => setLabel(calc()), 30000);
    return () => clearInterval(t);
  }, []);
  return label;
}

function ModeButton({ mode, icon, label, description, selected, onPress, delay, children }: {
  mode: GameMode;
  icon: string;
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
  delay: number;
  children?: ReactNode;
}) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withTiming(1, { duration: 400, easing: Easing.out(Easing.back(1.5)) }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  return (
    <Animated.View style={[animStyle, { flex: 1 }]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.modeButton,
          selected && styles.modeButtonSelected,
          { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
        ]}
      >
        <View style={[styles.modeIconBubble, selected && { backgroundColor: 'rgba(108,92,231,0.25)' }]}>
          <MaterialCommunityIcons
            name={icon as any}
            size={22}
            color={selected ? Colors.accentGlow : Colors.textSecondary}
          />
        </View>
        <Text style={[styles.modeLabel, selected && styles.modeLabelSelected]}>{label}</Text>
        <Text style={styles.modeDesc}>{description}</Text>
        {children}
      </Pressable>
    </Animated.View>
  );
}

function DifficultyButton({ difficulty, onPress, delay, locked }: {
  difficulty: Difficulty;
  onPress: () => void;
  delay: number;
  locked?: boolean;
}) {
  const config = DIFFICULTY_CONFIG[difficulty];
  const color = locked ? Colors.textMuted : Colors.difficultyColors[difficulty];
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withTiming(1, { duration: 400, easing: Easing.out(Easing.back(1.5)) }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  return (
    <Animated.View style={[animStyle, { flex: 1 }]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.diffButton,
          { borderColor: color, opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] },
          locked && styles.diffButtonLocked,
        ]}
      >
        {locked ? (
          <Ionicons name="lock-closed" size={14} color={Colors.textMuted} style={{ marginBottom: 6 }} />
        ) : (
          <View style={[styles.diffDot, { backgroundColor: color }]} />
        )}
        <Text style={[styles.diffLabel, { color }]}>{config.label}</Text>
        <Text style={styles.diffDesc}>{locked ? 'Shop unlock' : config.description}</Text>
      </Pressable>
    </Animated.View>
  );
}

function DailyDiffToggle({ onSelect }: { onSelect: (d: Difficulty) => void }) {
  return (
    <View style={styles.dailyToggle}>
      <Pressable
        onPress={() => onSelect('medium')}
        style={({ pressed }) => [styles.dailyTogglePill, { opacity: pressed ? 0.7 : 1 }]}
      >
        <View style={[styles.dailyToggleDot, { backgroundColor: Colors.difficultyColors.medium }]} />
        <Text style={[styles.dailyToggleText, { color: Colors.difficultyColors.medium }]}>Standard</Text>
      </Pressable>
      <Pressable
        onPress={() => onSelect('hard')}
        style={({ pressed }) => [styles.dailyTogglePill, { opacity: pressed ? 0.7 : 1 }]}
      >
        <View style={[styles.dailyToggleDot, { backgroundColor: Colors.difficultyColors.hard }]} />
        <Text style={[styles.dailyToggleText, { color: Colors.difficultyColors.hard }]}>Hard</Text>
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const { selectMode, selectDifficulty, gameMode, streak, coins, hintTokens, gamesWon, gamesPlayed, dailyHardUnlocked, dailyPlayed, lastDailyGame, lastWinDate, openShop, ownedItems, toastMessage, toastType, clearToast } = useGame();
  const insets = useSafeAreaInsets();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const nextIn = useTimeToMidnight();

  useEffect(() => {
    AsyncStorage.getItem('hasSeenTutorial').then(val => {
      if (!val) setShowHelp(true);
    }).catch(() => {});
  }, []);

  const handleCloseHelp = async () => {
    setShowHelp(false);
    try {
      await AsyncStorage.setItem('hasSeenTutorial', 'true');
    } catch {}
  };

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const dateLabel = today.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  const dailyAlreadyPlayed = !!(dailyPlayed[`${todayKey}_medium`] || dailyPlayed[`${todayKey}_hard`]);
  const dailyWon = dailyAlreadyPlayed && lastDailyGame?.date === todayKey && lastDailyGame.phase === 'won';
  const extremeUnlocked = ownedItems.includes('extreme');
  const wonToday = lastWinDate === todayKey;
  const choosingDailyLevel = gameMode === 'daily' && dailyHardUnlocked && !dailyAlreadyPlayed;

  const streakLine = streak === 0
    ? 'Win a game today to start a streak'
    : wonToday
      ? `${streak} day streak. See you tomorrow!`
      : `${streak} day streak. Win today to keep it!`;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 28, backgroundColor: 'transparent' }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.statsRow}>
        <View style={styles.statChip}>
          <Ionicons name="flame" size={16} color={Colors.streak} />
          <Text style={styles.statValue}>{streak}</Text>
        </View>
        <Pressable onPress={openShop} style={styles.statChip} hitSlop={6} accessibilityRole="button" accessibilityLabel="Coins. Open shop">
          <MaterialCommunityIcons name="circle-multiple" size={16} color={Colors.coin} />
          <Text style={styles.statValue}>{coins}</Text>
        </Pressable>
        <View style={styles.statChip}>
          <Ionicons name="bulb" size={16} color="#06B6D4" />
          <Text style={styles.statValue}>{hintTokens}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => setShowSettings(true)} style={styles.iconButton} hitSlop={8} accessibilityRole="button" accessibilityLabel="Settings">
          <Ionicons name="settings-outline" size={20} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.titleSection}>
        <Logo />
        <Text style={styles.tagline}>Crack the colour code</Text>
      </View>

      <Pressable
        onPress={() => selectMode('daily')}
        accessibilityRole="button"
        accessibilityLabel="Daily Challenge"
        style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] }]}
      >
        <LinearGradient
          colors={dailyAlreadyPlayed ? ['#2b2f55', '#1f2440'] : ['#7C6CF2', '#5B45D6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.dailyCard}
        >
          <View style={styles.dailyTopRow}>
            <Text style={styles.dailyKicker}>DAILY CHALLENGE</Text>
            <Text style={styles.dailyDate}>{dateLabel}</Text>
          </View>
          <Text style={styles.dailyTitle}>
            {dailyAlreadyPlayed ? (dailyWon ? 'Cracked it!' : 'Not today') : "Today's code is ready"}
          </Text>
          <Text style={styles.dailySub}>
            {dailyAlreadyPlayed ? `Next code in ${nextIn}` : 'One code a day. The same for everyone.'}
          </Text>

          {choosingDailyLevel ? (
            <DailyDiffToggle onSelect={selectDifficulty} />
          ) : (
            <View style={styles.dailyBottomRow}>
              <View style={styles.dailyStreak}>
                <Ionicons name="flame" size={14} color={streak > 0 ? '#FFB199' : 'rgba(255,255,255,0.6)'} />
                <Text style={styles.dailyStreakText}>{streakLine}</Text>
              </View>
              <View style={[styles.dailyCta, dailyAlreadyPlayed && styles.dailyCtaDone]}>
                <Text style={[styles.dailyCtaText, dailyAlreadyPlayed && { color: Colors.textPrimary }]}>
                  {dailyAlreadyPlayed ? 'View' : 'Play'}
                </Text>
                <Ionicons name={dailyAlreadyPlayed ? 'eye-outline' : 'play'} size={14} color={dailyAlreadyPlayed ? Colors.textPrimary : '#4A36C9'} />
              </View>
            </View>
          )}
        </LinearGradient>
      </Pressable>

      <Text style={[styles.sectionLabel, { marginTop: 22 }]}>MORE WAYS TO PLAY</Text>
      <View style={styles.modeRow}>
        <ModeButton
          mode="timeAttack"
          icon="timer-outline"
          label="Time Attack"
          description="60 seconds. Crack as many as you can."
          selected={gameMode === 'timeAttack'}
          onPress={() => selectMode('timeAttack')}
          delay={150}
        />
        <ModeButton
          mode="endless"
          icon="infinity"
          label="Practice"
          description="No timer, no pressure. Play as long as you like."
          selected={gameMode === 'endless'}
          onPress={() => selectMode('endless')}
          delay={220}
        />
      </View>

      {gameMode && gameMode !== 'daily' && (
        <View style={styles.diffSection}>
          <Text style={styles.sectionLabel}>CHOOSE A LEVEL</Text>
          <View style={styles.diffRow}>
            <DifficultyButton difficulty="easy" onPress={() => selectDifficulty('easy')} delay={0} />
            <DifficultyButton difficulty="medium" onPress={() => selectDifficulty('medium')} delay={60} />
          </View>
          <View style={[styles.diffRow, { marginTop: 10 }]}>
            <DifficultyButton difficulty="hard" onPress={() => selectDifficulty('hard')} delay={120} />
            <DifficultyButton difficulty="extreme" onPress={() => selectDifficulty('extreme')} delay={180} locked={!extremeUnlocked} />
          </View>
        </View>
      )}

      <StreakRewards streak={streak} />

      <View style={styles.bottomButtons}>
        <Pressable onPress={openShop} style={styles.bottomButton}>
          <Ionicons name="storefront-outline" size={18} color={Colors.accentGlow} />
          <Text style={[styles.bottomButtonText, { color: Colors.accentGlow }]}>Shop</Text>
        </Pressable>
        <Pressable onPress={() => setShowLeaderboard(true)} style={styles.bottomButton}>
          <MaterialCommunityIcons name="trophy-outline" size={18} color={Colors.coin} />
          <Text style={[styles.bottomButtonText, { color: Colors.coin }]}>Best scores</Text>
        </Pressable>
        <Pressable onPress={() => setShowHelp(true)} style={styles.bottomButton}>
          <Ionicons name="help-circle-outline" size={18} color={Colors.textSecondary} />
          <Text style={[styles.bottomButtonText, { color: Colors.textSecondary }]}>How to play</Text>
        </Pressable>
      </View>

      {gamesPlayed > 0 && (
        <Text style={styles.miniStatText}>
          {gamesWon} of {gamesPlayed} games won
        </Text>
      )}

      <LeaderboardModal visible={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
      <HowToPlayModal visible={showHelp} onClose={handleCloseHelp} />
      <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} onHowToPlay={() => setShowHelp(true)} />

      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onHide={clearToast} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(30,41,55,0.85)',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 18,
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30,41,55,0.85)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  logoLetterWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  tagline: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 14,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  dailyCard: {
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  dailyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dailyKicker: {
    fontSize: 11,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'Inter_700Bold',
  },
  dailyDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    fontFamily: 'Inter_400Regular',
  },
  dailyTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  dailySub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.82)',
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  dailyBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    gap: 10,
  },
  dailyStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  dailyStreakText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'Inter_600SemiBold',
    flexShrink: 1,
  },
  dailyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 22,
  },
  dailyCtaDone: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  dailyCtaText: {
    fontSize: 15,
    color: '#4A36C9',
    fontFamily: 'Inter_700Bold',
  },
  sectionLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 2,
    marginBottom: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  modeButton: {
    flex: 1,
    backgroundColor: 'rgba(30,41,55,0.85)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  modeButtonSelected: {
    borderColor: Colors.accent,
    backgroundColor: '#1a1d3a',
  },
  modeIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: 12,
  },
  modeLabel: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontFamily: 'Inter_700Bold',
  },
  modeLabelSelected: {
    color: Colors.accentGlow,
  },
  modeDesc: {
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textSecondary,
    marginTop: 4,
    fontFamily: 'Inter_400Regular',
  },
  diffSection: {
    marginBottom: 20,
  },
  diffRow: {
    flexDirection: 'row',
    gap: 10,
  },
  diffButton: {
    backgroundColor: 'rgba(30,41,55,0.85)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    minHeight: 84,
    justifyContent: 'center',
  },
  diffButtonLocked: {
    backgroundColor: 'rgba(30,41,55,0.5)',
    borderStyle: 'dashed' as any,
  },
  diffDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 8,
  },
  diffLabel: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  diffDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
  dailyToggle: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  dailyTogglePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(17,24,39,0.55)',
    paddingVertical: 11,
    borderRadius: 14,
  },
  dailyToggleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dailyToggleText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  rewardsCard: {
    backgroundColor: 'rgba(30,41,55,0.6)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 14,
  },
  rewardsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionLabelInline: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 2,
    fontFamily: 'Inter_600SemiBold',
  },
  rewardsNext: {
    fontSize: 12,
    color: Colors.coin,
    fontFamily: 'Inter_600SemiBold',
  },
  rewardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rewardItem: {
    alignItems: 'center',
    flex: 1,
  },
  rewardBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 6,
  },
  rewardBubbleDone: {
    backgroundColor: Colors.coin,
    borderColor: Colors.coin,
  },
  rewardBubbleNext: {
    borderColor: Colors.coin,
  },
  rewardDay: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: 'Inter_700Bold',
  },
  rewardLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  miniStatText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 14,
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  bottomButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(30,41,55,0.6)',
  },
  bottomButtonText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
});
