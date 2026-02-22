import { useEffect } from 'react';
import { StyleSheet, Text, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { TileStatus } from '@/contexts/GameContext';

interface GameTileProps {
  letter: string;
  status: TileStatus;
  index: number;
  shouldReveal: boolean;
  shouldShake: boolean;
  tileSize: number;
}

function getStatusColor(status: TileStatus): string {
  switch (status) {
    case 'correct': return Colors.correct;
    case 'present': return Colors.present;
    case 'absent': return Colors.absent;
    default: return Colors.tileDefault;
  }
}

export default function GameTile({ letter, status, index, shouldReveal, shouldShake, tileSize }: GameTileProps) {
  const flipProgress = useSharedValue(0);
  const shakeX = useSharedValue(0);
  const popScale = useSharedValue(1);

  useEffect(() => {
    if (shouldReveal && (status === 'correct' || status === 'present' || status === 'absent')) {
      flipProgress.value = withDelay(
        index * 150,
        withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) })
      );
    }
  }, [shouldReveal, status]);

  useEffect(() => {
    if (shouldShake) {
      shakeX.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(-3, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    }
  }, [shouldShake]);

  useEffect(() => {
    if (letter && status === 'filled') {
      popScale.value = withSequence(
        withTiming(1.1, { duration: 60 }),
        withTiming(1, { duration: 60 }),
      );
    }
  }, [letter]);

  const animatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [0, 0.5, 1], [0, 90, 0]);
    const bgIsRevealed = flipProgress.value > 0.5;
    const backgroundColor = bgIsRevealed ? getStatusColor(status) : Colors.tileDefault;
    const borderColor = letter
      ? bgIsRevealed ? 'transparent' : Colors.textMuted
      : Colors.tileBorder;

    return {
      transform: [
        { translateX: shakeX.value },
        { scale: popScale.value },
        ...(Platform.OS !== 'web' ? [{ perspective: 600 }, { rotateY: `${rotateY}deg` }] : []),
      ],
      backgroundColor,
      borderColor,
    };
  });

  const fontSize = tileSize * 0.5;

  return (
    <Animated.View style={[styles.tile, { width: tileSize, height: tileSize }, animatedStyle]}>
      <Text style={[styles.letter, { fontSize }]}>{letter}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderWidth: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 2,
  },
  letter: {
    color: Colors.white,
    fontWeight: '800',
    fontFamily: 'Inter_700Bold',
  },
});
