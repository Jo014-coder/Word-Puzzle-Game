import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

const SOUND_KEY = 'soundEnabled';

let soundEnabledCache: boolean | null = null;

async function isSoundEnabled(): Promise<boolean> {
  if (soundEnabledCache !== null) return soundEnabledCache;
  try {
    const val = await AsyncStorage.getItem(SOUND_KEY);
    soundEnabledCache = val !== 'false';
  } catch {
    soundEnabledCache = true;
  }
  return soundEnabledCache;
}

export function setSoundEnabledCache(enabled: boolean) {
  soundEnabledCache = enabled;
}

async function playSound(source: number): Promise<void> {
  const enabled = await isSoundEnabled();
  if (!enabled) return;
  const { sound } = await Audio.Sound.createAsync(source, { shouldPlay: true, volume: 0.7 });
  sound.setOnPlaybackStatusUpdate(status => {
    if ('didJustFinish' in status && status.didJustFinish) {
      sound.unloadAsync().catch(() => {});
    }
  });
}

export async function playPegPlace(): Promise<void> {
  try {
    await playSound(require('@/assets/sounds/peg_place.wav'));
  } catch {}
}

export async function playRowSubmit(): Promise<void> {
  try {
    await playSound(require('@/assets/sounds/row_submit.wav'));
  } catch {}
}

export async function playWin(): Promise<void> {
  try {
    await playSound(require('@/assets/sounds/win.wav'));
  } catch {}
}

export async function playLose(): Promise<void> {
  try {
    await playSound(require('@/assets/sounds/lose.wav'));
  } catch {}
}

export async function playHint(): Promise<void> {
  try {
    await playSound(require('@/assets/sounds/hint.wav'));
  } catch {}
}
