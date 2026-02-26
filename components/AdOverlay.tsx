import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';

interface AdOverlayProps {
  type: 'interstitial' | 'rewarded';
  onComplete: () => void;
}

export default function AdOverlay({ type, onComplete }: AdOverlayProps) {
  const [countdown, setCountdown] = useState(type === 'interstitial' ? 3 : 5);
  const [finished, setFinished] = useState(false);
  const completedRef = useRef(false);
  const progress = useSharedValue(0);

  useEffect(() => {
    const total = type === 'interstitial' ? 3 : 5;
    progress.value = withTiming(1, { duration: total * 1000, easing: Easing.linear });

    const interval = setInterval(() => {
      setCountdown(prev => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          setFinished(true);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (finished && !completedRef.current) {
      completedRef.current = true;
      if (type === 'interstitial') {
        onComplete();
      }
    }
  }, [finished]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%` as any,
  }));

  const handleClose = () => {
    if (completedRef.current && type === 'interstitial') return;
    completedRef.current = true;
    onComplete();
  };

  return (
    <Modal transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.adContainer}>
          <View style={styles.adHeader}>
            <Text style={styles.adLabel}>
              {type === 'interstitial' ? 'AD' : 'REWARDED AD'}
            </Text>
            {finished ? (
              <Pressable onPress={handleClose} hitSlop={12} style={styles.closeButton}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </Pressable>
            ) : (
              <Text style={styles.countdownText}>{countdown}s</Text>
            )}
          </View>

          <View style={styles.adBody}>
            <Ionicons
              name={type === 'interstitial' ? 'megaphone-outline' : 'play-circle-outline'}
              size={64}
              color={Colors.textMuted}
            />
            <Text style={styles.adTitle}>
              {type === 'interstitial' ? 'Advertisement' : 'Watch to earn coins'}
            </Text>
            <Text style={styles.adSubtitle}>
              {type === 'interstitial'
                ? 'Test Ad — ca-app-pub-3940256099942544/1033173712'
                : 'Test Ad — ca-app-pub-3940256099942544/5224354917'}
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, barStyle]} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  adContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  adHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  adLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 2,
    fontFamily: 'Inter_600SemiBold',
  },
  closeButton: {
    padding: 4,
  },
  countdownText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
  },
  adBody: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 12,
  },
  adTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'Inter_700Bold',
  },
  adSubtitle: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.surfaceLight,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
  },
});
