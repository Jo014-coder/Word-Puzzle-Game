import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// One time ad consent prompt, shown before the ad SDK starts. The answer is
// passed to LevelPlay as GDPR consent: "Yes" allows personalised ads, "No"
// still shows ads but without personal data. Players can change their mind
// from "Privacy choices" on the home screen.
const KEY = 'griddl_ad_consent_v1';

export type AdConsent = 'granted' | 'denied';

export async function getStoredConsent(): Promise<AdConsent | null> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

async function store(value: AdConsent): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, value);
  } catch {}
}

export function askForConsent(): Promise<AdConsent> {
  return new Promise(resolve => {
    Alert.alert(
      'Ads and your privacy',
      'Griddl is free and shows a few ads. May our ad partners use data from this device to show ads that suit you? You can change this any time with "Privacy choices" on the home screen.',
      [
        {
          text: 'No thanks',
          style: 'cancel',
          onPress: () => {
            void store('denied');
            resolve('denied');
          },
        },
        {
          text: 'Yes',
          onPress: () => {
            void store('granted');
            resolve('granted');
          },
        },
      ],
      { cancelable: false },
    );
  });
}

export async function ensureConsent(): Promise<AdConsent> {
  return (await getStoredConsent()) ?? (await askForConsent());
}
