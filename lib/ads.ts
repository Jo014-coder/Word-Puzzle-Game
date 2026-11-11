// Browser preview version. No real ads are loaded on the web.
// The preview shows a clearly labelled placeholder so you can see where ads appear.
export const ADS_ARE_PREVIEW = true;

export async function initAds(): Promise<void> {}

export function showInterstitial(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 1200));
}

export function isRewardedReady(): boolean {
  return true;
}

export function showRewarded(): Promise<boolean> {
  return new Promise(resolve => setTimeout(() => resolve(true), 1200));
}

export function hasPrivacyOptions(): boolean {
  return false;
}

export async function openPrivacyOptions(): Promise<void> {}
