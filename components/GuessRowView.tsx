import { useEffect } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
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
import { FeedbackPin } from './FeedbackPins';
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
  /** Peg size chosen by the game screen so the whole board fits. */
  pegSize?: number;
  /** Tighter spacing for small screens. */
  compact?: boolean;
}

/** Peg size for a given code length, shared so the board and palette stay in proportion. */
export function boardPegSize(screenWidth: number, codeLength: number) {
  const available = Math.min(screenWidth, 420) - 32 - 28 - 24; // screen margin, row number, row padding
  const gap = codeLength >= 6 ? 6 : 10;
  return { pegSize: Math.min(Math.floor((available - gap * (codeLength - 1)) / codeLength), 50), gap };
}

const MIN_PEG = 24;

/**
 * Picks the largest peg size at which the whole board (every row) fits in the space
 * available, so the player never has to scroll to see earlier guesses.
 */
export function fitBoard(screenWidth: number, boardHeight: number, codeLength: number, rowCount: number) {
  const byWidth = boardPegSize(screenWidth, codeLength).pegSize;
  if (boardHeight <= 0 || rowCount <= 0) return { pegSize: byWidth, compact: false, fits: true };
  const perRow = (boardHeight - 16) / rowCount;
  // Row height = peg + gap + clue marker (about a quarter of the peg) + padding and margins.
  const roomy = Math.floor((perRow - 24) / 1.26);
  if (roomy >= 38) return { pegSize: Math.min(byWidth, roomy), compact: false, fits: true };
  const tight = Math.floor((perRow - 13) / 1.26);
  return { pegSize: Math.max(MIN_PEG, Math.min(byWidth, tight)), compact: true, fits: tight >= MIN_PEG };
}

export default function GuessRowView({ row, rowIndex, isCurrent, isShaking, isRevealing, isLastAttempt, codeLength, pegSize: pegSizeProp, compact }: GuessRowViewProps) {
  const { selectedSlot, selectSlot, clearShake, finishReveal, goldPegsUnlocked, phase } = useGame();
  const { width } = useWindowDimensions();
  const shakeX = useSharedValue(0);
  const revealScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const pulseOpacity = useSharedValue(0);

  const sized = boardPegSize(width, codeLength);
  const pegSize = pegSizeProp ?? sized.pegSize;
  const gap = sized.gap;
  const pinSize = Math.max(7, Math.round(pegSize * 0.24));

  useEffect(() => {
    glowOpacity.value = withTiming(isCurrent && phase === 'playing' ? 1 : 0, { duration: 250 });
  }, [isCurrent, phase]);

  useEffect(() => {
    if (isCurrent && isLastAttempt && phase === 'playing') {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
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
      const t = setTimeout(clearShake, 350);
      return () => clearTimeout(t);
    }
  }, [isShaking]);

  useEffect(() => {
    if (isRevealing) {
      revealScale.value = withSequence(
        withDelay(200, withSpring(1.03, { damping: 8 })),
        withSpring(1, { damping: 8 })
      );
      const t = setTimeout(finishReveal, 300 + codeLength * 110);
      return () => clearTimeout(t);
    }
  }, [isRevealing]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }, { scale: revealScale.value }],
  }));

  const activeStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(255,255,255,${glowOpacity.value * 0.06})`,
    borderColor: pulseOpacity.value > 0.01
      ? `rgba(239,68,68,${pulseOpacity.value})`
      : `rgba(162,155,254,${glowOpacity.value * 0.45})`,
  }));

  const rowDone = row.submitted;
  const rowEmpty = !isCurrent && !rowDone;

  return (
    <Animated.View style={[styles.row, compact && styles.rowCompact, animatedStyle, activeStyle, rowEmpty && styles.rowDimmed]}>
      <Text style={[styles.rowNumber, isCurrent && styles.rowNumberActive]}>{rowIndex + 1}</Text>
      <View style={[styles.pegsContainer, { gap }]}>
        {row.pegs.map((peg, pi) => (
          <View key={pi} style={styles.pegColumn}>
            <ColorPeg
              colorIndex={peg.colorIndex}
              size={pegSize}
              selected={isCurrent && selectedSlot === pi}
              onPress={isCurrent ? () => selectSlot(pi) : undefined}
              disabled={!isCurrent || phase !== 'playing'}
              goldBorder={goldPegsUnlocked && rowDone}
            />
            <View style={{ height: compact ? 3 : 5 }} />
            <FeedbackPin
              key={row.feedback ? 'f' : 'e'}
              peg={row.feedback ? row.feedback[pi] : null}
              index={pi}
              size={pinSize}
              animated={isRevealing}
              testID={row.feedback ? `clue-${rowIndex}-${pi}-${row.feedback[pi]}` : undefined}
            />
          </View>
        ))}
      </View>
      <View style={styles.rowNumberSpacer} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingTop: 7,
    paddingBottom: 5,
    marginVertical: 2,
    marginHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  rowCompact: {
    paddingTop: 3,
    paddingBottom: 2,
    marginVertical: 0,
    borderRadius: 12,
  },
  rowDimmed: {
    opacity: 0.4,
  },
  rowNumber: {
    width: 14,
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  rowNumberActive: {
    color: Colors.accentGlow,
  },
  rowNumberSpacer: {
    width: 14,
  },
  pegsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  pegColumn: {
    alignItems: 'center',
  },
});
