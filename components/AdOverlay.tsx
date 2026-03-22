import { useEffect, useRef, useState } from 'react';
import { Platform, View, Text, StyleSheet, Pressable } from 'react-native';

const INTERSTITIAL_ID = 'ca-app-pub-1857750915324923/3325721935';
const REWARDED_ID = 'ca-app-pub-1857750915324923/6239659881';
const INTERSTITIAL_TEST_ID = 'ca-app-pub-3940256099942544/1033173712';
const REWARDED_TEST_ID = 'ca-app-pub-3940256099942544/5224354917';

interface AdOverlayProps {
  type: 'interstitial' | 'rewarded';
  onComplete: () => void;
  onDismiss?: () => void;
}

function SimulatedAd({ type, onComplete, onDismiss }: AdOverlayProps) {
  const [countdown, setCountdown] = useState(type === 'interstitial' ? 3 : 5);
  const [canSkip, setCanSkip] = useState(false);
  const calledRef = useRef(false);

  const finish = (rewarded: boolean) => {
    if (calledRef.current) return;
    calledRef.current = true;
    if (rewarded) {
      onComplete();
    } else {
      (onDismiss || onComplete)();
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanSkip(true);
          if (type === 'interstitial') {
            finish(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (type === 'interstitial') {
    return (
      <View style={styles.overlay}>
        <View style={styles.adBox}>
          <Text style={styles.adLabel}>AD</Text>
          <Text style={styles.adTitle}>Griddl Premium</Text>
          <Text style={styles.adSub}>Remove ads for the best experience</Text>
          <View style={styles.countdownBadge}>
            <Text style={styles.countdownText}>{countdown > 0 ? countdown : '✓'}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.adBox}>
        <Text style={styles.adLabel}>REWARDED AD</Text>
        <Text style={styles.adTitle}>Watch & Earn</Text>
        <Text style={styles.adSub}>Watch this ad to earn +3 coins 🪙</Text>
        <View style={styles.countdownBadge}>
          <Text style={styles.countdownText}>{countdown > 0 ? countdown : '✓'}</Text>
        </View>
        {canSkip && (
          <Pressable
            style={styles.claimButton}
            onPress={() => finish(true)}
          >
            <Text style={styles.claimText}>Claim +3 Coins</Text>
          </Pressable>
        )}
        {!canSkip && (
          <Pressable style={styles.skipButton} onPress={() => finish(false)}>
            <Text style={styles.skipText}>Skip (no reward)</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function AdOverlay({ type, onComplete, onDismiss }: AdOverlayProps) {
  const calledRef = useRef(false);
  const rewardEarnedRef = useRef(false);
  const [useSimulation, setUseSimulation] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setUseSimulation(true);
      return;
    }
    let isMounted = true;
    const dismiss = () => {
      if (isMounted && !calledRef.current) { calledRef.current = true; (onDismiss || onComplete)(); }
    };
    const runAd = async () => {
      try {
        const { InterstitialAd, RewardedAd, AdEventType, RewardedAdEventType } = await import('react-native-google-mobile-ads');
        const isDev = __DEV__;
        if (type === 'interstitial') {
          const adUnitId = isDev ? INTERSTITIAL_TEST_ID : INTERSTITIAL_ID;
          const interstitial = InterstitialAd.createForAdRequest(adUnitId, { requestNonPersonalizedAdsOnly: false });
          const unsubLoad = interstitial.addAdEventListener(AdEventType.LOADED, () => interstitial.show());
          const unsubClose = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
            unsubLoad(); unsubClose();
            if (isMounted && !calledRef.current) { calledRef.current = true; onComplete(); }
          });
          interstitial.addAdEventListener(AdEventType.ERROR, () => {
            if (isMounted) setUseSimulation(true);
          });
          interstitial.load();
        } else {
          const adUnitId = isDev ? REWARDED_TEST_ID : REWARDED_ID;
          const rewarded = RewardedAd.createForAdRequest(adUnitId, { requestNonPersonalizedAdsOnly: false });
          rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => rewarded.show());
          rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
            rewardEarnedRef.current = true;
          });
          rewarded.addAdEventListener(AdEventType.CLOSED, () => {
            if (isMounted && !calledRef.current) {
              calledRef.current = true;
              if (rewardEarnedRef.current) { onComplete(); } else { dismiss(); }
            }
          });
          rewarded.addAdEventListener(AdEventType.ERROR, () => {
            if (isMounted) setUseSimulation(true);
          });
          rewarded.load();
        }
      } catch {
        if (isMounted) setUseSimulation(true);
      }
    };
    runAd();
    return () => { isMounted = false; };
  }, []);

  if (useSimulation) {
    return (
      <SimulatedAd
        type={type}
        onComplete={onComplete}
        onDismiss={onDismiss}
      />
    );
  }

  return null;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  adBox: {
    width: '80%',
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    padding: 32,
    alignItems: 'center',
  },
  adLabel: {
    fontSize: 10,
    letterSpacing: 3,
    color: '#888',
    marginBottom: 16,
  },
  adTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  adSub: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 24,
  },
  countdownBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  countdownText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  claimButton: {
    backgroundColor: '#FBBF24',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  claimText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 13,
    color: '#666',
  },
});
