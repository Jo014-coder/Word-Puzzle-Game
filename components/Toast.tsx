import { useEffect } from 'react';
import { Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';

interface ToastProps {
  message: string;
  onHide: () => void;
  duration?: number;
}

export default function Toast({ message, onHide, duration = 2000 }: ToastProps) {
  const translateY = useSharedValue(-80);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 250 });
    opacity.value = withSequence(
      withTiming(1, { duration: 250 }),
      withDelay(duration, withTiming(0, { duration: 300 }))
    );

    const timer = setTimeout(() => {
      onHide();
    }, duration + 600);

    return () => clearTimeout(timer);
  }, [message]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 80 : 60,
    alignSelf: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  text: {
    color: Colors.background,
    fontWeight: '700',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
});
