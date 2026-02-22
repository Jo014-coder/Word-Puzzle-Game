import { View, StyleSheet, StatusBar } from 'react-native';
import Colors from '@/constants/colors';
import { useGame } from '@/contexts/GameContext';
import HomeScreen from '@/components/HomeScreen';
import GameScreen from '@/components/GameScreen';
import ResultScreen from '@/components/ResultScreen';

export default function Index() {
  const { screen } = useGame();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      {screen === 'home' && <HomeScreen />}
      {screen === 'game' && <GameScreen />}
      {screen === 'result' && <ResultScreen />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
