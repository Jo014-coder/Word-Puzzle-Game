// Expo config plugin for Unity LevelPlay.
// LevelPlay's React Native package needs two Play Services libraries in the
// app module (see the unity-levelplay-mediation README) and the advertising
// ID permission. This adds them during `expo prebuild` / EAS builds so there
// is no hand edited android folder to maintain.
const { withAppBuildGradle, withAndroidManifest } = require('expo/config-plugins');

const DEPS = [
  "implementation 'com.google.android.gms:play-services-appset:16.0.2'",
  "implementation 'com.google.android.gms:play-services-ads-identifier:18.0.1'",
];

function withLevelPlayGradle(config) {
  return withAppBuildGradle(config, cfg => {
    let src = cfg.modResults.contents;
    const missing = DEPS.filter(d => !src.includes(d));
    if (missing.length) {
      src = src.replace(
        /dependencies\s*\{/,
        match => `${match}\n    // Added by withLevelPlay\n    ${missing.join('\n    ')}`,
      );
      cfg.modResults.contents = src;
    }
    return cfg;
  });
}

function withAdIdPermission(config) {
  return withAndroidManifest(config, cfg => {
    const manifest = cfg.modResults.manifest;
    const perms = (manifest['uses-permission'] = manifest['uses-permission'] || []);
    const name = 'com.google.android.gms.permission.AD_ID';
    if (!perms.some(p => p.$['android:name'] === name)) {
      perms.push({ $: { 'android:name': name } });
    }
    return cfg;
  });
}

module.exports = function withLevelPlay(config) {
  return withAdIdPermission(withLevelPlayGradle(config));
};
