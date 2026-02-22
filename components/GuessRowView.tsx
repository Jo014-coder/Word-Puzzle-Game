import { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
  withSpring,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import ColorPeg from './ColorPeg';
import FeedbackPins from './FeedbackPins';
import Colors from '@/constants/colors';
import { GuessRow, useGame } from '@/contexts/GameContext';

interface GuessRowViewProps {
  row: GuessRow;
  rowIndex: number;
  isCurrent: boolean;
  isShaking: boolean;
  isRevealing: boolean;
  isLastAttempt: boolean;
  codeLength: number;
}

export default function GuessRowView({ row, rowIndex, isCurrent, isShaking, isRevealing, isLastAttempt, codeLength }: GuessRowViewProps) {
  const { selectedSlot, selectSlot, clearShake, finishReveal, goldPegsUnlocked, phase } = useGame();
  const { width } = useWindowDimensions();
  const shakeX = useSharedValue(0);
  const revealScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const pulseOpacity = useSharedValue(0);

  const availableWidth = Math.min(width, 420) - 24;
  const feedbackWidth = codeLength * 16 + 16;
  const pegAreaWidth = availableWidth - feedbackWidth;
  const pegSize = Math.min(Math.floor(pegAreaWidth / codeLength) - 8, 44);

  useEffect(() => {
    if (isCurrent && phase === 'playing') {
      glowOpacity.value = withTiming(1, { duration: 300 });
    } else {
      glowOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isCurrent, phase]);

  useEffect(() => {
    if (isCurrent && isLastAttempt && phase === 'playing') {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false
      );
    } else {
      pulseOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isCurrent, isLastAttempt, phase]);

  useEffect(() => {
    if (isShaking) {
      shakeX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-4, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
      setTimeout(clearShake, 350);
    }
  }, [isShaking]);

  useEffect(() => {
    if (isRevealing) {
      revealScale.value = withSequence(
        withDelay(200, withSpring(1.04, { damping: 8 })),
        withSpring(1, { damping: 8 })
      );
      setTimeout(finishReveal, 500);
    }
  }, [isRevealing]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }, { scale: revealScale.value }],
  }));

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(255,255,255,${glowOpacity.value * 0.2})`,
    shadowOpacity: glowOpacity.value * 0.15,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(239,68,68,${pulseOpacity.value})`,
  }));

  const rowDone = row.submitted;
  const rowEmpty = !isCurrent && !rowDone;

  return (
    <Animated.View style={[
      styles.row,
      animatedStyle,
      isCurrent && borderStyle,
      isCurrent && isLastAttempt && pulseStyle,
      rowEmpty && styles.rowDimmed,
    ]}>
      <View style={styles.pegsContainer}>
        {row.pegs.map((peg, pi) => (
          <ColorPeg
            key={pi}
            colorIndex={peg.colorIndex}
            size={pegSize}
            selected={isCurrent && selectedSlot === pi}
            onPress={isCurrent ? () => selectSlot(pi) : undefined}
            disabled={!isCurrent || phase !== 'playing'}
            goldBorder={goldPegsUnlocked && rowDone}
          />
        ))}
      </View>
      <View style={styles.feedbackContainer}>
        {row.feedback ? (
          <FeedbackPins
            feedback={row.feedback}
            pinSize={12}
            animated={isRevealing}
          />
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginVertical: 2,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 0,
  },
  rowDimmed: {
    opacity: 0.35,
  },
  pegsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  feedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});
