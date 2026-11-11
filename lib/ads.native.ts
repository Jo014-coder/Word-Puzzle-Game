// Real AdMob ads for Android and iOS.
// Flow: ask for consent (UK/EEA users see Google's consent form), then initialise
// the SDK and preload one interstitial and one rewarded ad so they show instantly.
// If an ad is not ready, the game simply continues. No fake ads, no free rewards.
import mobileAds, {
  AdsConsent,
  AdsConsentPrivacyOptionsRequirementStatus,
  InterstitialAd,
  RewardedAd,
  AdEventType,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

const INTERSTITIAL_ID = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-2071050565025322/7780850882';
const REWARDED_ID = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-2071050565025322/6799090091';

export const ADS_ARE_PREVIEW = false;

let canRequestAds = false;
let started = false;
let interstitial: InterstitialAd | null = null;
let interstitialReady = false;
let rewarded: RewardedAd | null = null;
let rewardedReady = false;
let privacyOptionsRequired = false;

function loadInterstitial() {
  if (!canRequestAds) return;
  interstitialReady = false;
  interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_ID);
  interstitial.addAdEventListener(AdEventType.LOADED, () => { interstitialReady = true; });
  interstitial.addAdEventListener(AdEventType.ERROR, () => {
    interstitialReady = false;
    setTimeout(loadInterstitial, 60_000);
  });
  interstitial.load();
}

function loadRewarded() {
  if (!canRequestAds) return;
  rewardedReady = false;
  rewarded = RewardedAd.createForAdRequest(REWARDED_ID);
  rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => { rewardedReady = true; });
  rewarded.addAdEventListener(AdEventType.ERROR, () => {
    rewardedReady = false;
    setTimeout(loadRewarded, 60_000);
  });
  rewarded.load();
}

export async function initAds(): Promise<void> {
  if (started) return;
  started = true;
  try {
    const info = await AdsConsent.gatherConsent();
    canRequestAds = info.canRequestAds;
    privacyOptionsRequired =
      info.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED;
  } catch {
    // If the consent service cannot be reached, fall back to any consent given earlier.
    try {
      const info = await AdsConsent.getConsentInfo();
      canRequestAds = info.canRequestAds;
    } catch {
      canRequestAds = false;
    }
  }
  if (!canRequestAds) return;
  try {
    await mobileAds().initialize();
    loadInterstitial();
    loadRewarded();
  } catch {}
}

/** Shows an interstitial if one is ready. Always resolves, so the game never gets stuck. */
export function showInterstitial(): Promise<void> {
  return new Promise(resolve => {
    if (!interstitial || !interstitialReady) { resolve(); return; }
    const ad = interstitial;
    interstitialReady = false;
    let done = false;
    const finish = () => { if (done) return; done = true; resolve(); loadInterstitial(); };
    ad.addAdEventListener(AdEventType.CLOSED, finish);
    ad.addAdEventListener(AdEventType.ERROR, finish);
    ad.show().catch(finish);
  });
}

export function isRewardedReady(): boolean {
  return rewardedReady;
}

/** Shows a rewarded ad. Resolves true only if the player watched it to the end. */
export function showRewarded(): Promise<boolean> {
  return new Promise(resolve => {
    if (!rewarded || !rewardedReady) { resolve(false); return; }
    const ad = rewarded;
    rewardedReady = false;
    let earned = false;
    let done = false;
    const finish = () => { if (done) return; done = true; resolve(earned); loadRewarded(); };
    ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => { earned = true; });
    ad.addAdEventListener(AdEventType.CLOSED, finish);
    ad.addAdEventListener(AdEventType.ERROR, finish);
    ad.show().catch(finish);
  });
}

export function hasPrivacyOptions(): boolean {
  return privacyOptionsRequired;
}

export async function openPrivacyOptions(): Promise<void> {
  try { await AdsConsent.showPrivacyOptionsForm(); } catch {}
}
