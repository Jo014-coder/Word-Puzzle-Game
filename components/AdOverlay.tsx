import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ADS_ARE_PREVIEW, showInterstitial, showRewarded } from '@/lib/ads';

interface AdOverlayProps {
  type: 'interstitial' | 'rewarded';
  onComplete: () => void;
  onDismiss?: () => void;
}

// Shows a real ad on phones (if one is loaded) and a labelled placeholder in the browser preview.
// If no ad is ready, the game continues straight away and no reward is given.
export default function AdOverlay({ type, onComplete, onDismiss }: AdOverlayProps) {
  const calledRef = useRef(false);

  useEffect(() => {
    const done = (ok: boolean) => {
      if (calledRef.current) return;
      calledRef.current = true;
      if (ok) onComplete(); else (onDismiss || onComplete)();
    };
    if (type === 'interstitial') {
      showInterstitial().then(() => done(true));
    } else {
      showRewarded().then(earned => done(earned));
    }
  }, []);

  if (!ADS_ARE_PREVIEW) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.box}>
        <Text style={styles.label}>PREVIEW ONLY</Text>
        <Text style={styles.title}>{type === 'interstitial' ? 'An ad would play here' : 'A rewarded ad would play here'}</Text>
        <Text style={styles.sub}>Real ads only appear in the phone app.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  box: {
    width: '80%',
    maxWidth: 360,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    padding: 28,
    alignItems: 'center',
  },
  label: { fontSize: 10, letterSpacing: 3, color: '#888', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 8 },
  sub: { fontSize: 13, color: '#aaa', textAlign: 'center' },
});
