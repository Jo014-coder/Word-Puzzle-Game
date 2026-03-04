import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

const INTERSTITIAL_ID = 'ca-app-pub-1857750915324923/3325721935';
const REWARDED_ID = 'ca-app-pub-1857750915324923/6239659881';
const INTERSTITIAL_TEST_ID = 'ca-app-pub-3940256099942544/1033173712';
const REWARDED_TEST_ID = 'ca-app-pub-3940256099942544/5224354917';

interface AdOverlayProps {
  type: 'interstitial' | 'rewarded';
  onComplete: () => void;
  onDismiss?: () => void;
}

export default function AdOverlay({ type, onComplete, onDismiss }: AdOverlayProps) {
  const calledRef = useRef(false);
  const rewardEarnedRef = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (!calledRef.current) { calledRef.current = true; onComplete(); }
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
            if (isMounted && !calledRef.current) { calledRef.current = true; onComplete(); }
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
          rewarded.addAdEventListener(AdEventType.ERROR, () => { dismiss(); });
          rewarded.load();
        }
      } catch {
        if (type === 'interstitial') {
          if (isMounted && !calledRef.current) { calledRef.current = true; onComplete(); }
        } else {
          dismiss();
        }
      }
    };
    runAd();
    return () => { isMounted = false; };
  }, []);

  return null;
}
