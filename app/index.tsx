import { View, StyleSheet, StatusBar } from 'react-native';
import { useGame } from '@/contexts/GameContext';
import HomeScreen from '@/components/HomeScreen';
import GameScreen from '@/components/GameScreen';
import ResultScreen from '@/components/ResultScreen';
import ShopScreen from '@/components/ShopScreen';

export default function Index() {
  const { screen } = useGame();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      {screen === 'home' && <HomeScreen />}
      {screen === 'game' && <GameScreen />}
      {screen === 'result' && <ResultScreen />}
      {screen === 'shop' && <ShopScreen />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
