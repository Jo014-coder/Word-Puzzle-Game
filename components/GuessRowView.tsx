import { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
  withSpring,
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
  sequenceLength: number;
}

export default function GuessRowView({ row, rowIndex, isCurrent, isShaking, isRevealing, sequenceLength }: GuessRowViewProps) {
  const { selectedSlot, selectSlot, clearShake, finishReveal } = useGame();
  const { width } = useWindowDimensions();
  const shakeX = useSharedValue(0);
  const revealScale = useSharedValue(1);
  const rowOpacity = useSharedValue(isCurrent ? 1 : row.feedback ? 1 : 0.4);

  const pegSize = Math.min(Math.floor((Math.min(width, 420) - 100) / sequenceLength) - 8, 44);

  useEffect(() => {
    if (isCurrent) {
      rowOpacity.value = withTiming(1, { duration: 300 });
    }
  }, [isCurrent]);

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
        withDelay(200, withSpring(1.05, { damping: 8 })),
        withSpring(1, { damping: 8 })
      );
      setTimeout(finishReveal, 600);
    }
  }, [isRevealing]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }, { scale: revealScale.value }],
    opacity: rowOpacity.value,
  }));

  return (
    <Animated.View style={[styles.row, animatedStyle]}>
      <View style={styles.pegsContainer}>
        {row.pegs.map((peg, pi) => (
          <ColorPeg
            key={pi}
            colorIndex={peg.colorIndex}
            size={pegSize}
            selected={isCurrent && selectedSlot === pi}
            onPress={isCurrent ? () => selectSlot(pi) : undefined}
            disabled={!isCurrent}
          />
        ))}
      </View>
      <View style={styles.feedbackContainer}>
        {row.feedback ? (
          <FeedbackPins feedback={row.feedback} total={sequenceLength} pinSize={Math.max(8, pegSize * 0.22)} />
        ) : (
          <View style={[styles.feedbackPlaceholder, { width: 30, height: 30 }]} />
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginVertical: 2,
  },
  pegsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  feedbackContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  feedbackPlaceholder: {},
});
