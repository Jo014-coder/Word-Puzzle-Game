import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useGame } from '@/contexts/GameContext';
import { DIFFICULTY_CONFIG } from '@/constants/game';
import ColorPeg from './ColorPeg';
import Confetti from './Confetti';
import Toast from './Toast';

function SecretCodeReveal({ code, codeLength }: { code: number[]; codeLength: number }) {
  return (
    <View style={styles.codeReveal}>
      <Text style={styles.codeLabel}>THE CODE</Text>
      <View style={styles.codeRow}>
        {code.map((c, i) => (
          <RevealPeg key={i} colorIndex={c} index={i} />
        ))}
      </View>
    </View>
  );
}

function RevealPeg({ colorIndex, index }: { colorIndex: number; index: number }) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(index * 120, withSpring(1, { damping: 6, stiffness: 150 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <ColorPeg colorIndex={colorIndex} size={44} disabled />
    </Animated.View>
  );
}

function AnimatedCounter({ value, label, icon, color, delay }: { value: number | string; label: string; icon: string; color: string; delay: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 400, easing: Easing.out(Easing.back(1.5)) }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.counterCard, animStyle]}>
      <MaterialCommunityIcons name={icon as any} size={22} color={color} />
      <Text style={[styles.counterValue, { color }]}>{value}</Text>
      <Text style={styles.counterLabel}>{label}</Text>
    </Animated.View>
  );
}

export default function ResultScreen() {
  const {
    phase, secretCode, coinsEarned, streak, coins, playAgain, backToMenu,
    showConfetti, toastMessage, toastType, clearToast, currentRow,
    effectiveDifficulty, difficulty, gameMode, timeAttackScore, timeAttackCoins,
    endlessAutoLevelUp, shareDaily, viewingDaily, requestRewardedAd, rewardedAdWatched,
  } = useGame();
  const insets = useSafeAreaInsets();
  const diff = effectiveDifficulty || difficulty || 'easy';
  const config = DIFFICULTY_CONFIG[diff];
  const won = phase === 'won';
  const webTop = Platform.OS === 'web' ? 67 : 0;
  const webBottom = Platform.OS === 'web' ? 34 : 0;

  const cardScale = useSharedValue(0.8);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    cardScale.value = withDelay(200, withSpring(1, { damping: 10 }));
    cardOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
  }, []);

  const cardAnim = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const isTimeAttack = gameMode === 'timeAttack';

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTop + 40, paddingBottom: insets.bottom + webBottom + 20 }]}>
      {showConfetti && <Confetti />}

      <Animated.View style={[styles.card, cardAnim]}>
        <View style={styles.emojiSection}>
          <Ionicons
            name={won ? 'trophy' : 'close-circle'}
            size={56}
            color={won ? Colors.coin : Colors.streak}
          />
          <Text style={styles.resultTitle}>
            {won ? (isTimeAttack ? 'Time Attack Complete!' : 'You cracked it!') : (isTimeAttack ? 'Time Up!' : 'Game Over')}
          </Text>
          {won && !isTimeAttack && (
            <Text style={styles.attemptText}>
              Solved in {currentRow + 1} {currentRow === 0 ? 'attempt' : 'attempts'}
            </Text>
          )}
        </View>

        {!won && <SecretCodeReveal code={secretCode} codeLength={config.codeLength} />}
        {isTimeAttack && (
          <View style={styles.timeAttackResults}>
            <Text style={styles.taLabel}>Codes Solved</Text>
            <Text style={styles.taValue}>{timeAttackScore}</Text>
          </View>
        )}

        <View style={styles.countersRow}>
          <AnimatedCounter
            value={`+${isTimeAttack ? timeAttackCoins : coinsEarned}`}
            label="Coins"
            icon="circle-multiple"
            color={Colors.coin}
            delay={400}
          />
          <AnimatedCounter
            value={streak}
            label="Streak"
            icon="fire"
            color={Colors.streak}
            delay={600}
          />
          <AnimatedCounter
            value={coins}
            label="Total"
            icon="wallet"
            color={Colors.accentGlow}
            delay={800}
          />
        </View>

        {endlessAutoLevelUp && (
          <View style={styles.levelUpBanner}>
            <Ionicons name="arrow-up-circle" size={18} color={Colors.correctPeg} />
            <Text style={styles.levelUpText}>Difficulty leveled up!</Text>
          </View>
        )}

        {!rewardedAdWatched && (
          <Pressable
            onPress={requestRewardedAd}
            style={({ pressed }) => [styles.rewardedAdButton, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Ionicons name="play-circle" size={20} color="#FBBF24" />
            <Text style={styles.rewardedAdText}>Watch ad for +3 coins</Text>
            <Text style={styles.rewardedAdEmoji}>🪙</Text>
          </Pressable>
        )}

        <View style={styles.buttonsRow}>
          {gameMode === 'daily' ? (
            <>
              <Pressable
                onPress={shareDaily}
                style={({ pressed }) => [styles.primaryButton, { opacity: pressed ? 0.8 : 1 }]}
              >
                <Ionicons name="share-social" size={20} color={Colors.textPrimary} />
                <Text style={styles.primaryButtonText}>Share</Text>
              </Pressable>
              <Pressable
                onPress={backToMenu}
                style={({ pressed }) => [styles.secondaryButton, { opacity: pressed ? 0.8 : 1 }]}
              >
                <Ionicons name="grid-outline" size={18} color={Colors.textSecondary} />
                <Text style={styles.secondaryButtonText}>Back to Menu</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                onPress={playAgain}
                style={({ pressed }) => [styles.primaryButton, { opacity: pressed ? 0.8 : 1 }]}
              >
                <Ionicons name="refresh" size={20} color={Colors.textPrimary} />
                <Text style={styles.primaryButtonText}>Play Again</Text>
              </Pressable>
              <Pressable
                onPress={backToMenu}
                style={({ pressed }) => [styles.secondaryButton, { opacity: pressed ? 0.8 : 1 }]}
              >
                <Ionicons name="grid-outline" size={18} color={Colors.textSecondary} />
                <Text style={styles.secondaryButtonText}>Back to Menu</Text>
              </Pressable>
            </>
          )}
        </View>
      </Animated.View>

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
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emojiSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 12,
    fontFamily: 'Inter_700Bold',
  },
  attemptText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    fontFamily: 'Inter_400Regular',
  },
  codeReveal: {
    alignItems: 'center',
    marginBottom: 20,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 2,
    marginBottom: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  codeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timeAttackResults: {
    alignItems: 'center',
    marginBottom: 16,
  },
  taLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: 'Inter_400Regular',
  },
  taValue: {
    fontSize: 40,
    fontWeight: '900',
    color: Colors.correctPeg,
    fontFamily: 'Inter_700Bold',
  },
  countersRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  counterCard: {
    alignItems: 'center',
    gap: 4,
  },
  counterValue: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'Inter_700Bold',
  },
  counterLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: 'Inter_400Regular',
  },
  levelUpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(34,197,94,0.12)',
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 16,
  },
  levelUpText: {
    color: Colors.correctPeg,
    fontWeight: '700',
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  buttonsRow: {
    gap: 10,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryButtonText: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceLight,
    paddingVertical: 12,
    borderRadius: 14,
  },
  secondaryButtonText: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  rewardedAdButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(251,191,36,0.12)',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.25)',
  },
  rewardedAdText: {
    color: '#FBBF24',
    fontWeight: '700',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  rewardedAdEmoji: {
    fontSize: 16,
  },
});
