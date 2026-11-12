// Web build: no ads. Native builds use ads.native.ts.
export async function initAds(): Promise<void> {}
export async function showPrivacyOptions(): Promise<void> {}
export async function interstitialAllowed(): Promise<boolean> {
  return false;
}
export async function showInterstitial(): Promise<void> {}
export async function showRewarded(): Promise<'earned' | 'skipped' | 'unavailable'> {
  return 'unavailable';
}
