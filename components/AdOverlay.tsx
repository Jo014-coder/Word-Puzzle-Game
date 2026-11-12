import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { interstitialAllowed, showInterstitial, showRewarded } from '@/lib/ads';

interface AdOverlayProps {
  type: 'interstitial' | 'rewarded';
  onComplete: () => void;
  onDismiss?: () => void;
}

// Shows a real Unity LevelPlay ad. There is no simulated fallback: if no ad
// is available the player simply carries on, and a reward is only given
// when a rewarded ad was actually watched to the end.
export default function AdOverlay({ type, onComplete, onDismiss }: AdOverlayProps) {
  const calledRef = useRef(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const finish = (rewarded: boolean) => {
      if (!alive || calledRef.current) return;
      calledRef.current = true;
      if (rewarded) onComplete();
      else (onDismiss || onComplete)();
    };

    (async () => {
      if (type === 'interstitial') {
        if (await interstitialAllowed()) await showInterstitial();
        finish(true);
        return;
      }
      const result = await showRewarded();
      if (result === 'earned') {
        finish(true);
      } else if (result === 'unavailable') {
        if (alive) setMessage('No ad available right now. Please try again later.');
        setTimeout(() => finish(false), 2000);
      } else {
        finish(false);
      }
    })().catch(() => finish(type === 'interstitial'));

    return () => {
      alive = false;
    };
  }, []);

  if (!message) return null;
  return (
    <View style={styles.overlay} pointerEvents="none">
      <View style={styles.box}>
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  box: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 14,
    maxWidth: '80%',
  },
  text: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
});
