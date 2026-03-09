import { View, Text, Pressable, StyleSheet, ScrollView, useWindowDimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useEffect, useRef } from 'react';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useGame } from '@/contexts/GameContext';
import { DIFFICULTY_CONFIG } from '@/constants/game';
import GuessRowView from './GuessRowView';
import ColorPeg from './ColorPeg';
import Toast from './Toast';

function TopBar() {
  const { backToMenu, streak, coins, hintTokens, difficulty, effectiveDifficulty, useHint, gameMode, timeLeft, timeAttackScore } = useGame();
  const diff = effectiveDifficulty || difficulty || 'easy';
  const config = DIFFICULTY_CONFIG[diff];
  const color = Colors.difficultyColors[diff];

  return (
    <View style={styles.topBar}>
      <Pressable onPress={backToMenu} hitSlop={12}>
        <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
      </Pressable>

      <View style={styles.topBarCenter}>
        <View style={styles.statChip}>
          <Ionicons name="flame" size={16} color={Colors.streak} />
          <Text style={styles.statChipText}>{streak}</Text>
        </View>
        <View style={styles.statChip}>
          <MaterialCommunityIcons name="circle-multiple" size={16} color={Colors.coin} />
          <Text style={styles.statChipText}>{coins}</Text>
        </View>
        {gameMode === 'timeAttack' && (
          <View style={styles.statChip}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.correctPeg} />
            <Text style={styles.statChipText}>{timeAttackScore}</Text>
          </View>
        )}
      </View>

      <View style={styles.topBarRight}>
        {hintTokens > 0 && (
          <Pressable onPress={useHint} style={styles.hintButton} hitSlop={8}>
            <Ionicons name="bulb" size={18} color="#06B6D4" />
            <Text style={styles.hintCount}>{hintTokens}</Text>
          </Pressable>
        )}
        {gameMode !== 'daily' && (
          <View style={[styles.diffBadge, { borderColor: color }]}>
            <Text style={[styles.diffBadgeText, { color }]}>{config.label}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function ProgressBar() {
  const { currentRow, gameMode, timeLeft, effectiveDifficulty, difficulty, phase } = useGame();
  const diff = effectiveDifficulty || difficulty || 'easy';
  const config = DIFFICULTY_CONFIG[diff];

  const progress = useSharedValue(0);
  const timeProgress = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(currentRow / config.maxAttempts, { duration: 400 });
  }, [currentRow]);

  useEffect(() => {
    if (gameMode === 'timeAttack') {
      timeProgress.value = withTiming(timeLeft / 60, { duration: 900, easing: Easing.linear });
    }
  }, [timeLeft, gameMode]);

  const barStyle = useAnimatedStyle(() => {
    const pct = gameMode === 'timeAttack' ? timeProgress.value : (1 - progress.value);
    const r = gameMode === 'timeAttack'
      ? Math.round(239 * (1 - timeProgress.value) + 34 * timeProgress.value)
      : Math.round(239 * progress.value + 34 * (1 - progress.value));
    const g = gameMode === 'timeAttack'
      ? Math.round(68 * (1 - timeProgress.value) + 197 * timeProgress.value)
      : Math.round(68 * progress.value + 197 * (1 - progress.value));
    const b = gameMode === 'timeAttack' ? 87 : 113;

    return {
      width: `${Math.max(pct * 100, 2)}%` as any,
      backgroundColor: `rgb(${r},${g},${b})`,
    };
  });

  return (
    <View style={styles.progressContainer}>
      <Animated.View style={[styles.progressBar, barStyle]} />
      {gameMode === 'timeAttack' && (
        <Text style={styles.timerText}>{timeLeft}s</Text>
      )}
      {gameMode !== 'timeAttack' && (
        <Text style={styles.attemptsText}>
          {phase === 'won'
            ? `Solved in ${currentRow + 1} / ${config.maxAttempts}`
            : `${config.maxAttempts - currentRow} left`}
        </Text>
      )}
    </View>
  );
}

function ColorPalette() {
  const { selectColor, clearSlot, submitGuess, effectiveDifficulty, difficulty, phase } = useGame();
  const diff = effectiveDifficulty || difficulty || 'easy';
  const config = DIFFICULTY_CONFIG[diff];
  const { width } = useWindowDimensions();
  const paletteSize = Math.min(Math.floor((Math.min(width, 420) - 80) / config.colorCount) - 4, 52);

  if (phase !== 'playing') return null;

  return (
    <View style={styles.paletteSection}>
      <View style={styles.paletteRow}>
        {Array.from({ length: config.colorCount }, (_, i) => (
          <Pressable
            key={i}
            onPress={() => selectColor(i)}
            testID={`palette-color-${i}`}
            accessibilityRole="button"
            accessibilityLabel={`Color ${i}`}
            style={({ pressed }) => [
              styles.paletteButton,
              { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.9 : 1 }] },
            ]}
          >
            <ColorPeg colorIndex={i} size={paletteSize} disabled />
          </Pressable>
        ))}
      </View>
      <View style={styles.actionRow}>
        <Pressable onPress={clearSlot} testID="clear-button" accessibilityRole="button" accessibilityLabel="Clear" style={({ pressed }) => [styles.actionButton, styles.deleteButton, { opacity: pressed ? 0.7 : 1 }]}>
          <Ionicons name="backspace-outline" size={20} color={Colors.textPrimary} />
          <Text style={styles.actionButtonText}>Clear</Text>
        </Pressable>
        <Pressable onPress={submitGuess} testID="submit-button" accessibilityRole="button" accessibilityLabel="Submit" style={({ pressed }) => [styles.actionButton, styles.submitButton, { opacity: pressed ? 0.8 : 1 }]}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.textPrimary} />
          <Text style={styles.actionButtonText}>Submit</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function GameScreen() {
  const { rows, currentRow, shakeRow, revealingRow, toastMessage, toastType, clearToast, effectiveDifficulty, difficulty, phase, viewingDaily, shareDaily, backToMenu, secretCode } = useGame();
  const insets = useSafeAreaInsets();
  const diff = effectiveDifficulty || difficulty || 'easy';
  const config = DIFFICULTY_CONFIG[diff];
  const scrollRef = useRef<ScrollView>(null);
  const webTop = Platform.OS === 'web' ? 67 : 0;
  const webBottom = Platform.OS === 'web' ? 34 : 0;

  useEffect(() => {
    if (currentRow > 3 && scrollRef.current) {
      scrollRef.current.scrollToEnd({ animated: true });
    }
  }, [currentRow]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTop }]}>
      <TopBar />
      <ProgressBar />

      <ScrollView
        ref={scrollRef}
        style={styles.gridScroll}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      >
        {rows.map((row, idx) => (
          <GuessRowView
            key={idx}
            row={row}
            rowIndex={idx}
            isCurrent={idx === currentRow && phase === 'playing'}
            isShaking={shakeRow === idx}
            isRevealing={revealingRow === idx}
            isLastAttempt={idx === config.maxAttempts - 1}
            codeLength={config.codeLength}
          />
        ))}
      </ScrollView>

      <View style={{ paddingBottom: insets.bottom + webBottom }}>
        {viewingDaily && phase !== 'playing' ? (
          <View style={styles.dailyReviewButtons}>
            {secretCode && (
              <View style={styles.secretCodeRow}>
                <Text style={styles.secretCodeLabel}>The code was:</Text>
                <View style={styles.secretCodePegs}>
                  {secretCode.map((c, i) => (
                    <ColorPeg key={i} colorIndex={c} size={28} disabled />
                  ))}
                </View>
              </View>
            )}
            <View style={styles.dailyReviewRow}>
              <Pressable
                onPress={shareDaily}
                style={({ pressed }) => [styles.shareButton, { opacity: pressed ? 0.8 : 1 }]}
              >
                <Ionicons name="share-social" size={20} color={Colors.textPrimary} />
                <Text style={styles.shareButtonText}>Share</Text>
              </Pressable>
              <Pressable
                onPress={backToMenu}
                style={({ pressed }) => [styles.menuButton, { opacity: pressed ? 0.8 : 1 }]}
              >
                <Ionicons name="grid-outline" size={18} color={Colors.textSecondary} />
                <Text style={styles.menuButtonText}>Back to Menu</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <ColorPalette />
        )}
      </View>

      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onHide={clearToast} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  topBarCenter: {
    flexDirection: 'row',
    gap: 14,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statChipText: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hintCount: {
    color: '#06B6D4',
    fontWeight: '700',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  diffBadge: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  diffBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter_600SemiBold',
  },
  progressContainer: {
    height: 20,
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    marginBottom: 6,
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 10,
  },
  timerText: {
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: 11,
    textAlign: 'center',
    fontFamily: 'Inter_700Bold',
  },
  attemptsText: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 11,
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
  },
  gridScroll: {
    flex: 1,
  },
  gridContent: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  paletteSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: Colors.backgroundLight,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  paletteRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  paletteButton: {
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  deleteButton: {
    backgroundColor: Colors.surface,
  },
  submitButton: {
    backgroundColor: Colors.accent,
  },
  dailyReviewButtons: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: Colors.backgroundLight,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  secretCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  secretCodeLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  secretCodePegs: {
    flexDirection: 'row',
    gap: 6,
  },
  dailyReviewRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.accent,
  },
  shareButtonText: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  menuButtonText: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  actionButtonText: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
