import { useEffect } from 'react';
import { Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';

interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'error' | 'milestone';
  onHide: () => void;
  duration?: number;
}

function getBgColor(type: string) {
  switch (type) {
    case 'success': return Colors.correct;
    case 'error': return '#FF4757';
    case 'milestone': return Colors.accent;
    default: return Colors.textPrimary;
  }
}

function getTextColor(type: string) {
  return type === 'info' ? Colors.background : '#FFFFFF';
}

export default function Toast({ message, type = 'info', onHide, duration = 2200 }: ToastProps) {
  const translateY = useSharedValue(-80);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 280 });
    opacity.value = withSequence(
      withTiming(1, { duration: 280 }),
      withDelay(duration, withTiming(0, { duration: 350 }))
    );

    const timer = setTimeout(onHide, duration + 700);
    return () => clearTimeout(timer);
  }, [message]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, { backgroundColor: getBgColor(type) }, animatedStyle]}>
      <Text style={[styles.text, { color: getTextColor(type) }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 80 : 60,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  text: {
    fontWeight: '700',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
});
