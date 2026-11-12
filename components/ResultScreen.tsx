import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
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
import { useGame, GuessRow } from '@/contexts/GameContext';
import { DIFFICULTY_CONFIG } from '@/constants/game';
import ColorPeg from './ColorPeg';
import Confetti from './Confetti';
import Toast from './Toast';
import { FeedbackPin } from './FeedbackPins';
import { LinearGradient } from 'expo-linear-gradient';

function SecretCodeReveal({ code, label }: { code: number[]; label: string }) {
  const size = code.length >= 7 ? 34 : code.length === 6 ? 40 : 48;
  return (
    <View style={styles.codeReveal}>
      <Text style={styles.codeLabel}>{label}</Text>
      <View style={styles.codeRow}>
        {code.map((c, i) => (
          <RevealPeg key={i} colorIndex={c} index={i} size={size} />
        ))}
      </View>
    </View>
  );
}

// A small picture of the player's game: one row of clue markers per guess.
// It shows how the game went without giving the code away.
function GuessRecap({ rows }: { rows: GuessRow[] }) {
  const done = rows.filter(r => r.submitted && r.feedback);
  if (done.length === 0) return null;
  return (
    <View style={styles.recap} accessibilityLabel={`Your ${done.length} guesses`}>
      {done.map((r, ri) => (
        <View key={ri} style={styles.recapRow}>
          <Text style={styles.recapNumber}>{ri + 1}</Text>
          {r.feedback!.map((f, i) => (
            <FeedbackPin key={i} peg={f} index={i} size={13} animated={false} />
          ))}
        </View>
      ))}
    </View>
  );
}

function timeToMidnight() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  const mins = Math.max(1, Math.round((next.getTime() - now.getTime()) / 60000));
  const h = Math.floor(mins / 60);
  return h > 0 ? `${h}h ${mins % 60}m` : `${mins}m`;
}

function winHeadline(attempts: number, maxAttempts: number) {
  if (attempts === 1) return 'Unbelievable!';
  if (attempts === maxAttempts) return 'Phew, just in time!';
  if (attempts === 2) return 'Genius!';
  if (attempts === 3) return 'Brilliant!';
  return 'You cracked it!';
}

function RevealPeg({ colorIndex, index, size }: { colorIndex: number; index: number; size: number }) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(300 + index * 120, withSpring(1, { damping: 12, stiffness: 180 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <ColorPeg colorIndex={colorIndex} size={size} disabled />
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
      <MaterialCommunityIcons name={icon as any} size={20} color={color} />
      <Text style={[styles.counterValue, { color }]}>{value}</Text>
      <Text style={styles.counterLabel}>{label}</Text>
    </Animated.View>
  );
}

export default function ResultScreen() {
  const {
    phase, secretCode, coinsEarned, streak, coins, playAgain, backToMenu,
    showConfetti, toastMessage, toastType, clearToast, currentRow, rows,
    effectiveDifficulty, difficulty, gameMode, timeAttackScore, timeAttackCoins,
    endlessAutoLevelUp, shareDaily, requestRewardedAd, rewardedAdWatched, lastWinDate,
  } = useGame();
  const insets = useSafeAreaInsets();
  const diff = effectiveDifficulty || difficulty || 'easy';
  const config = DIFFICULTY_CONFIG[diff];
  const won = phase === 'won';
  const isTimeAttack = gameMode === 'timeAttack';
  const isDaily = gameMode === 'daily';
  // Time Attack always ends on the clock, so it is a score screen, never a "loss".
  const positive = won || (isTimeAttack && timeAttackScore > 0);

  const cardScale = useSharedValue(0.9);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    cardScale.value = withDelay(150, withSpring(1, { damping: 14 }));
    cardOpacity.value = withDelay(150, withTiming(1, { duration: 350 }));
  }, []);

  const cardAnim = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const attempts = currentRow + 1;
  const submitted = rows.filter(r => r.submitted && r.feedback);
  const lastRow = submitted[submitted.length - 1];
  const bestGreens = submitted.reduce((m, r) => Math.max(m, r.feedback!.filter(f => f === 'green').length), 0);
  const lastGreens = lastRow ? lastRow.feedback!.filter(f => f === 'green').length : 0;
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const wonToday = lastWinDate === todayKey;

  let kicker: string;
  let title: string;
  let subtitle: string;
  if (isTimeAttack) {
    kicker = "TIME'S UP";
    title = timeAttackScore === 0 ? 'So close!' : timeAttackScore === 1 ? '1 code cracked' : `${timeAttackScore} codes cracked`;
    subtitle = timeAttackScore === 0 ? 'Sixty seconds goes fast. Have another go.' : 'Can you beat that?';
  } else if (won) {
    kicker = isDaily ? 'DAILY CHALLENGE' : 'CODE CRACKED';
    title = winHeadline(attempts, config.maxAttempts);
    subtitle = attempts === 1 ? 'Solved on your very first guess' : `Solved in ${attempts} of ${config.maxAttempts} guesses`;
  } else {
    const near = lastGreens >= config.codeLength - 1;
    kicker = isDaily ? 'DAILY CHALLENGE' : 'OUT OF GUESSES';
    title = near ? 'So close!' : 'Not this time';
    subtitle = near
      ? 'Just one peg away. That one hurts.'
      : bestGreens > 0
        ? `Your best guess had ${bestGreens} of ${config.codeLength} in the right place.`
        : 'This one was tricky. The next one is yours.';
  }

  let streakNote: string | null = null;
  if (won && streak >= 2) streakNote = `${streak} day streak`;
  else if (won && streak === 1) streakNote = 'Streak started. Come back tomorrow!';
  else if (!won && isDaily && streak === 0) streakNote = wonToday ? null : 'Win any game today to start a new streak';
  else if (!won && streak > 0) streakNote = wonToday ? `Your ${streak} day streak is safe` : `Win a game today to keep your ${streak} day streak`;

  const earned = isTimeAttack ? timeAttackCoins : coinsEarned;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      {showConfetti && <Confetti />}

      <Animated.View style={[styles.card, cardAnim]}>
        <LinearGradient
          colors={positive ? ['rgba(34,197,94,0.30)', 'rgba(34,197,94,0)'] : ['rgba(124,108,242,0.30)', 'rgba(124,108,242,0)']}
          style={styles.cardGlow}
          pointerEvents="none"
        />

        <View style={styles.headerSection}>
          <Text style={[styles.kicker, { color: positive ? Colors.correctBright : Colors.accentGlow }]}>{kicker}</Text>
          <Text style={styles.resultTitle}>{title}</Text>
          <Text style={styles.attemptText}>{subtitle}</Text>
        </View>

        {!isTimeAttack && (
          <SecretCodeReveal code={secretCode} label={won ? 'THE CODE' : 'THE CODE WAS'} />
        )}

        {!isTimeAttack && <GuessRecap rows={rows} />}

        {streakNote && (
          <View style={[styles.streakBanner, won && styles.streakBannerWon]}>
            <Ionicons name="flame" size={16} color={won ? Colors.streak : Colors.textSecondary} />
            <Text style={[styles.streakBannerText, won && { color: Colors.textPrimary }]}>{streakNote}</Text>
          </View>
        )}

        <View style={styles.countersRow}>
          {earned > 0 && (
            <AnimatedCounter value={`+${earned}`} label="Coins earned" icon="circle-multiple" color={Colors.coin} delay={500} />
          )}
          <AnimatedCounter value={coins} label="Your coins" icon="wallet" color={Colors.accentGlow} delay={650} />
          <AnimatedCounter value={streak} label="Day streak" icon="fire" color={Colors.streak} delay={800} />
        </View>

        {endlessAutoLevelUp && (
          <View style={styles.levelUpBanner}>
            <Ionicons name="arrow-up-circle" size={18} color={Colors.correctPeg} />
            <Text style={styles.levelUpText}>You are on a roll. Next game is a level harder!</Text>
          </View>
        )}

        {isDaily && (
          <Text style={styles.nextDaily}>Next daily code in {timeToMidnight()}</Text>
        )}

        <View style={styles.buttonsRow}>
          {isDaily ? (
            <Pressable
              onPress={shareDaily}
              style={({ pressed }) => [styles.primaryButton, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Ionicons name="share-social" size={20} color={Colors.textPrimary} />
              <Text style={styles.primaryButtonText}>{won ? 'Share your result' : 'Challenge a friend'}</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={playAgain}
              style={({ pressed }) => [styles.primaryButton, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Ionicons name="refresh" size={20} color={Colors.textPrimary} />
              <Text style={styles.primaryButtonText}>{won || isTimeAttack ? 'Play again' : 'Try again'}</Text>
            </Pressable>
          )}

          {!rewardedAdWatched && (
            <Pressable
              onPress={requestRewardedAd}
              style={({ pressed }) => [styles.rewardedAdButton, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Ionicons name="play-circle" size={20} color="#FBBF24" />
              <Text style={styles.rewardedAdText}>Watch an ad for +10 coins</Text>
            </Pressable>
          )}

          <Pressable
            onPress={backToMenu}
            style={({ pressed }) => [styles.secondaryButton, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={styles.secondaryButtonText}>Back to menu</Text>
          </Pressable>
        </View>
      </Animated.View>

      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onHide={clearToast} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  cardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 170,
  },
  headerSection: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 22,
  },
  kicker: {
    fontSize: 11,
    letterSpacing: 2.5,
    fontFamily: 'Inter_700Bold',
  },
  resultTitle: {
    fontSize: 30,
    color: Colors.textPrimary,
    marginTop: 10,
    textAlign: 'center',
    fontFamily: 'Inter_700Bold',
  },
  attemptText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
  codeReveal: {
    alignItems: 'center',
    marginBottom: 18,
  },
  codeLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 2,
    marginBottom: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  codeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  recap: {
    alignSelf: 'center',
    backgroundColor: 'rgba(17,24,39,0.55)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 6,
    marginBottom: 18,
  },
  recapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  recapNumber: {
    width: 12,
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: 'Inter_600SemiBold',
  },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  streakBannerWon: {
    backgroundColor: 'rgba(255,107,107,0.14)',
  },
  streakBannerText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    flexShrink: 1,
    textAlign: 'center',
  },
  countersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  counterCard: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    paddingVertical: 12,
  },
  counterValue: {
    fontSize: 20,
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
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  levelUpText: {
    color: Colors.correctPeg,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    flexShrink: 1,
  },
  nextDaily: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginBottom: 14,
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
    paddingVertical: 15,
    borderRadius: 16,
  },
  primaryButtonText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  rewardedAdButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(251,191,36,0.10)',
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
  },
  rewardedAdText: {
    color: '#FBBF24',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
