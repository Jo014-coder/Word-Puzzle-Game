// Small sound effect player. Sounds are loaded once and replayed.
// Failures are ignored so sound can never break the game.
import { Audio } from 'expo-av';

const FILES = {
  peg: require('../assets/sounds/peg_place.wav'),
  submit: require('../assets/sounds/row_submit.wav'),
  win: require('../assets/sounds/win.wav'),
  lose: require('../assets/sounds/lose.wav'),
  hint: require('../assets/sounds/hint.wav'),
} as const;

export type SoundName = keyof typeof FILES;

const loaded: Partial<Record<SoundName, Audio.Sound>> = {};
let enabled = true;
let preloading = false;

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

export async function preloadSounds() {
  if (preloading) return;
  preloading = true;
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: false });
  } catch {}
  for (const name of Object.keys(FILES) as SoundName[]) {
    try {
      const { sound } = await Audio.Sound.createAsync(FILES[name], { volume: name === 'peg' ? 0.5 : 0.8 });
      loaded[name] = sound;
    } catch {}
  }
}

export function playSound(name: SoundName) {
  if (!enabled) return;
  const s = loaded[name];
  if (!s) return;
  s.replayAsync().catch(() => {});
}
