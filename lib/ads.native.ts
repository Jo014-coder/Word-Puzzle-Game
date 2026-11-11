import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  LevelPlay,
  LevelPlayInitRequest,
  LevelPlayInterstitialAd,
  LevelPlayPrivacySettings,
  LevelPlayRewardedAd,
} from 'unity-levelplay-mediation';
import { askForConsent, ensureConsent } from './adConsent';

// Unity LevelPlay keys for Griddl (dashboard: platform.ironsrc.com).
const APP_KEY = process.env.EXPO_PUBLIC_LEVELPLAY_APP_KEY || '297b75b05';
const INTERSTITIAL_ID =
  process.env.EXPO_PUBLIC_LEVELPLAY_INTERSTITIAL_ID || 't2bjoo0ea68s16te';
const REWARDED_ID =
  process.env.EXPO_PUBLIC_LEVELPLAY_REWARDED_ID || 'colsasz4r03o91w6';

let initPromise: Promise<void> | null = null;
let initialised = false;

export async function initAds(): Promise<void> {
  if (initialised) return;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const consent = await ensureConsent();
    await LevelPlayPrivacySettings.setGDPRConsent(consent === 'granted');
    await new Promise<void>((resolve, reject) => {
      LevelPlay.init(LevelPlayInitRequest.builder(APP_KEY).build(), {
        onInitSuccess: () => resolve(),
        onInitFailed: err => reject(new Error(String(err?.errorMessage ?? 'init failed'))),
      }).catch(reject);
    });
    initialised = true;
    interstitial.loadAd().catch(() => {});
    rewarded.loadAd().catch(() => {});
  })().catch(err => {
    initPromise = null;
    throw err;
  });
  return initPromise;
}

export async function showPrivacyOptions(): Promise<void> {
  const consent = await askForConsent();
  try {
    await LevelPlayPrivacySettings.setGDPRConsent(consent === 'granted');
  } catch {}
}

// No interstitial in a player's first 3 games. After that GameContext's own
// 3 minute cooldown applies.
const GAMES_KEY = 'griddl_ad_games_started_v1';
const FREE_GAMES = 3;

export async function interstitialAllowed(): Promise<boolean> {
  let n = 0;
  try {
    n = parseInt((await AsyncStorage.getItem(GAMES_KEY)) || '0', 10) || 0;
  } catch {}
  n += 1;
  try {
    await AsyncStorage.setItem(GAMES_KEY, String(n));
  } catch {}
  return n > FREE_GAMES;
}

const interstitial = new LevelPlayInterstitialAd(INTERSTITIAL_ID);
const rewarded = new LevelPlayRewardedAd(REWARDED_ID);

let interstitialDone: (() => void) | null = null;
let rewardedDone: ((earned: boolean) => void) | null = null;
let rewardEarned = false;

interstitial.setListener({
  onAdLoaded: () => {},
  onAdLoadFailed: () => {},
  onAdInfoChanged: () => {},
  onAdDisplayed: () => {},
  onAdDisplayFailed: () => interstitialDone?.(),
  onAdClicked: () => {},
  onAdClosed: () => {
    interstitialDone?.();
    interstitial.loadAd().catch(() => {});
  },
});

rewarded.setListener({
  onAdLoaded: () => {},
  onAdLoadFailed: () => {},
  onAdInfoChanged: () => {},
  onAdDisplayed: () => {},
  onAdDisplayFailed: () => rewardedDone?.(false),
  onAdClicked: () => {},
  onAdRewarded: () => {
    rewardEarned = true;
  },
  onAdClosed: () => {
    rewardedDone?.(rewardEarned);
    rewarded.loadAd().catch(() => {});
  },
});

// Resolves when the ad has closed, or straight away if none is ready.
export async function showInterstitial(): Promise<void> {
  try {
    await initAds();
    if (!(await interstitial.isAdReady())) {
      interstitial.loadAd().catch(() => {});
      return;
    }
  } catch {
    return;
  }
  await new Promise<void>(resolve => {
    const timeout = setTimeout(done, 60_000);
    function done() {
      clearTimeout(timeout);
      interstitialDone = null;
      resolve();
    }
    interstitialDone = done;
    interstitial.showAd().catch(done);
  });
}

// 'earned' only if the player watched to the end. 'unavailable' if no ad
// could be shown: no reward is given in that case.
export async function showRewarded(): Promise<'earned' | 'skipped' | 'unavailable'> {
  try {
    await initAds();
    if (!(await rewarded.isAdReady())) {
      rewarded.loadAd().catch(() => {});
      return 'unavailable';
    }
  } catch {
    return 'unavailable';
  }
  rewardEarned = false;
  return new Promise(resolve => {
    const timeout = setTimeout(() => done(false), 120_000);
    function done(earned: boolean) {
      clearTimeout(timeout);
      rewardedDone = null;
      resolve(earned ? 'earned' : 'skipped');
    }
    rewardedDone = done;
    rewarded.showAd().catch(() => done(false));
  });
}
