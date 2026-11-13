import { Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

const RATING_KEY = 'griddl_rating_asked_v1';
const MIN_WINS = 3;

// Ask for a Play Store rating once, after the player has won a few games.
// Google decides whether the dialog actually appears (it has its own quota).
export async function maybeAskForRating(gamesWon: number): Promise<void> {
  if (Platform.OS === 'web' || gamesWon < MIN_WINS) return;
  try {
    if (await AsyncStorage.getItem(RATING_KEY)) return;
    if (!(await StoreReview.isAvailableAsync())) return;
    await AsyncStorage.setItem(RATING_KEY, String(Date.now()));
    await StoreReview.requestReview();
  } catch {}
}

const YOINK_ID = 'com.yoink.myapp';

export async function openYoink(): Promise<void> {
  const market = `market://details?id=${YOINK_ID}&referrer=utm_source%3Dgriddl%26utm_medium%3Dcross_promo`;
  const web = `https://play.google.com/store/apps/details?id=${YOINK_ID}&referrer=utm_source%3Dgriddl%26utm_medium%3Dcross_promo`;
  if (Platform.OS === 'android') {
    try {
      await Linking.openURL(market);
      return;
    } catch {}
  }
  Linking.openURL(web).catch(() => {});
}
