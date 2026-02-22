import { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';

const PARTICLE_COUNT = 40;
const CONFETTI_COLORS = ['#FF4757', '#3742FA', '#2ED573', '#FFA502', '#A55EEA', '#1E90FF', '#FFD93D', '#FF6B81'];

function ConfettiPiece({ index, screenWidth, screenHeight }: { index: number; screenWidth: number; screenHeight: number }) {
  const progress = useSharedValue(0);

  const config = useMemo(() => ({
    startX: Math.random() * screenWidth,
    endX: (Math.random() - 0.5) * screenWidth * 0.8,
    delay: Math.random() * 400,
    duration: 1800 + Math.random() * 1200,
    rotation: Math.random() * 720 - 360,
    size: 6 + Math.random() * 6,
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
  }), []);

  useEffect(() => {
    progress.value = withDelay(
      config.delay,
      withTiming(1, { duration: config.duration, easing: Easing.out(Easing.quad) })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const y = -50 + progress.value * (screenHeight + 100);
    const x = config.startX + progress.value * config.endX;
    const rotate = progress.value * config.rotation;
    const opacity = progress.value > 0.8 ? 1 - (progress.value - 0.8) * 5 : 1;

    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { rotate: `${rotate}deg` },
      ],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: config.size,
          height: config.size * 1.5,
          backgroundColor: config.color,
          borderRadius: 2,
          top: 0,
          left: 0,
        },
        animatedStyle,
      ]}
    />
  );
}

export default function Confetti() {
  const { width, height } = useWindowDimensions();

  const particles = useMemo(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => i),
  []);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="none">
      {particles.map(i => (
        <ConfettiPiece key={i} index={i} screenWidth={width} screenHeight={height} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 999,
    overflow: 'hidden',
  },
});
