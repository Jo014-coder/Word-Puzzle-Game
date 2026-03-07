import { View, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useGame } from '@/contexts/GameContext';
import { BACKGROUNDS } from '@/constants/backgrounds';
import HomeScreen from '@/components/HomeScreen';
import GameScreen from '@/components/GameScreen';
import ResultScreen from '@/components/ResultScreen';
import ShopScreen from '@/components/ShopScreen';
import AdOverlay from '@/components/AdOverlay';

export default function Index() {
  const { screen, activeBackground, adPhase, dismissAd, completeRewardedAd } = useGame();
  const bg = BACKGROUNDS.find(b => b.id === activeBackground) ?? BACKGROUNDS[0];

  return (
    <LinearGradient
      key={bg.id}
      colors={bg.colors as any}
      angle={bg.angle}
      useAngle={true}
      locations={bg.locations}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      {screen === 'home' && <HomeScreen />}
      {screen === 'game' && <GameScreen />}
      {screen === 'result' && <ResultScreen />}
      {screen === 'shop' && <ShopScreen />}
      {adPhase !== 'none' && (
        <AdOverlay
          type={adPhase}
          onComplete={adPhase === 'rewarded' ? completeRewardedAd : dismissAd}
          onDismiss={adPhase === 'rewarded' ? dismissAd : undefined}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
