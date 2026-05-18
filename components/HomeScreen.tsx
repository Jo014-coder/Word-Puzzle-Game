import { View, Text, Pressable, StyleSheet, useWindowDimensions, Platform, ScrollView } from 'react-native';
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

function ShimmerTitle() {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.7 + shimmer.value * 0.3,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Text style={styles.title}>GRIDDL</Text>
    </Animated.View>
  );
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
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.modeButton,
          selected && styles.modeButtonSelected,
          { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
        ]}
      >
        <View style={styles.modeIconRow}>
          <MaterialCommunityIcons
            name={icon as any}
            size={24}
            color={selected ? Colors.accent : Colors.textSecondary}
          />
          <Text style={[styles.modeLabel, selected && styles.modeLabelSelected]}>{label}</Text>
        </View>
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
  const { selectMode, selectDifficulty, gameMode, streak, coins, hintTokens, gamesWon, gamesPlayed, dailyHardUnlocked, dailyPlayed, lastDailyGame, openShop, ownedItems, toastMessage, toastType, clearToast } = useGame();
  const insets = useSafeAreaInsets();
  const webTop = Platform.OS === 'web' ? 67 : 0;
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

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
  const dailyAlreadyPlayed = !!(dailyPlayed[`${todayKey}_medium`] || dailyPlayed[`${todayKey}_hard`]);
  const hasDailyResult = !!(lastDailyGame && lastDailyGame.date === todayKey);
  const extremeUnlocked = ownedItems.includes('extreme');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + webTop + 16, paddingBottom: 32, backgroundColor: 'transparent' }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="flame" size={18} color={Colors.streak} />
          <Text style={styles.statValue}>{streak}</Text>
        </View>
        <Pressable onPress={openShop} style={styles.statItem} hitSlop={8}>
          <MaterialCommunityIcons name="circle-multiple" size={18} color={Colors.coin} />
          <Text style={styles.statValue}>{coins}</Text>
          <Ionicons name="chevron-forward" size={12} color={Colors.textMuted} />
        </Pressable>
        {hintTokens > 0 && (
          <View style={styles.statItem}>
            <Ionicons name="bulb" size={18} color="#06B6D4" />
            <Text style={styles.statValue}>{hintTokens}</Text>
          </View>
        )}
        <Pressable onPress={() => setShowHelp(true)} style={styles.helpButton} hitSlop={8} accessibilityRole="button" accessibilityLabel="How to play">
          <Ionicons name="help-circle-outline" size={22} color={Colors.textMuted} />
        </Pressable>
      </View>

      <View style={styles.titleSection}>
        <ShimmerTitle />
        <Text style={styles.tagline}>Crack the colour code</Text>
      </View>

      <View style={styles.modesSection}>
        <Text style={styles.sectionLabel}>GAME MODE</Text>
        <ModeButton
          mode="daily"
          icon="calendar-today"
          label="Daily Challenge"
          description={dailyAlreadyPlayed ? "Played! Tap to view your result." : "One try per day. Can you crack it?"}
          selected={gameMode === 'daily'}
          onPress={() => selectMode('daily')}
          delay={100}
        >
          {gameMode === 'daily' && dailyHardUnlocked && !dailyAlreadyPlayed && (
            <DailyDiffToggle onSelect={selectDifficulty} />
          )}
        </ModeButton>
        <ModeButton
          mode="timeAttack"
          icon="timer-outline"
          label="Time Attack"
          description="60 seconds. Solve as many as you can."
          selected={gameMode === 'timeAttack'}
          onPress={() => selectMode('timeAttack')}
          delay={200}
        />
        <ModeButton
          mode="endless"
          icon="infinity"
          label="Endless Mode"
          description="Practice and train. Build your streak."
          selected={gameMode === 'endless'}
          onPress={() => selectMode('endless')}
          delay={300}
        />
      </View>

      {gameMode && gameMode !== 'daily' && (
        <View style={styles.diffSection}>
          <Text style={styles.sectionLabel}>DIFFICULTY</Text>
          <View style={styles.diffRow}>
            <DifficultyButton difficulty="easy" onPress={() => selectDifficulty('easy')} delay={100} />
            <DifficultyButton difficulty="medium" onPress={() => selectDifficulty('medium')} delay={200} />
          </View>
          <View style={[styles.diffRow, { marginTop: 10 }]}>
            <DifficultyButton difficulty="hard" onPress={() => selectDifficulty('hard')} delay={300} />
            <DifficultyButton difficulty="extreme" onPress={() => selectDifficulty('extreme')} delay={400} locked={!extremeUnlocked} />
          </View>
        </View>
      )}

      {gamesPlayed > 0 && (
        <View style={styles.miniStats}>
          <Text style={styles.miniStatText}>
            {gamesWon}/{gamesPlayed} won
          </Text>
        </View>
      )}

      <View style={styles.bottomButtons}>
        <Pressable onPress={openShop} style={styles.shopButton}>
          <Ionicons name="storefront-outline" size={18} color={Colors.accentGlow} />
          <Text style={styles.shopButtonText}>Shop</Text>
        </Pressable>
        {gameMode === 'timeAttack' && (
          <Pressable onPress={() => setShowLeaderboard(true)} style={styles.leaderboardButton}>
            <MaterialCommunityIcons name="trophy-outline" size={18} color={Colors.coin} />
            <Text style={styles.leaderboardButtonText}>Leaderboard</Text>
          </Pressable>
        )}
      </View>

      <LeaderboardModal visible={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
      <HowToPlayModal visible={showHelp} onClose={handleCloseHelp} />

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
    paddingBottom: 0,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 2,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 8,
    fontFamily: 'Inter_700Bold',
  },
  tagline: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 8,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 1,
  },
  modesSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 2,
    marginBottom: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  modeButton: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  modeButtonSelected: {
    borderColor: Colors.accent,
    backgroundColor: '#1a1d3a',
  },
  modeIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  modeLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  modeLabelSelected: {
    color: Colors.accentGlow,
  },
  modeDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
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
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    minHeight: 88,
    justifyContent: 'center',
  },
  diffButtonLocked: {
    backgroundColor: 'rgba(30,41,55,0.6)',
    borderStyle: 'dashed' as any,
  },
  diffDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  diffLabel: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  diffDesc: {
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    lineHeight: 13,
  },
  dailyToggle: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    justifyContent: 'center',
  },
  dailyTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  dailyToggleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dailyToggleText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Inter_600SemiBold',
  },
  miniStats: {
    alignItems: 'center',
    marginTop: 8,
  },
  miniStatText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: 'Inter_400Regular',
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  shopButtonText: {
    fontSize: 14,
    color: Colors.accentGlow,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  leaderboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  leaderboardButtonText: {
    fontSize: 14,
    color: Colors.coin,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});
