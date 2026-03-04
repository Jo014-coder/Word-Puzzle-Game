import { View, StyleSheet, StatusBar } from 'react-native';
import Colors from '@/constants/colors';
import { useGame } from '@/contexts/GameContext';
import HomeScreen from '@/components/HomeScreen';
import GameScreen from '@/components/GameScreen';
import ResultScreen from '@/components/ResultScreen';
import ShopScreen from '@/components/ShopScreen';
import AdOverlay from '@/components/AdOverlay';

export default function Index() {
  const { screen, activeBackground, adPhase, dismissAd, completeRewardedAd } = useGame();
  const bg = Colors.backgroundThemes[activeBackground] || Colors.background;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={bg} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
