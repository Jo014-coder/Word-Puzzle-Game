import { View, Text, Pressable, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useGame, TileStatus } from '@/contexts/GameContext';

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK'],
];

function getKeyColor(status: TileStatus | undefined): string {
  switch (status) {
    case 'correct': return Colors.correct;
    case 'present': return Colors.present;
    case 'absent': return '#1a1a2e';
    default: return Colors.keyDefault;
  }
}

export default function GameKeyboard() {
  const { handleKeyPress, handleBackspace, handleSubmit, keyboardStatus, gameOver } = useGame();
  const { width } = useWindowDimensions();

  const keyWidth = Math.floor((Math.min(width, 420) - 24) / 10) - 3;
  const keyHeight = Math.max(42, keyWidth * 1.3);

  const onPress = (key: string) => {
    if (gameOver) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (key === 'ENTER') handleSubmit();
    else if (key === 'BACK') handleBackspace();
    else handleKeyPress(key);
  };

  return (
    <View style={styles.container}>
      {ROWS.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {row.map((key) => {
            const isSpecial = key === 'ENTER' || key === 'BACK';
            const status = keyboardStatus[key];
            const bgColor = isSpecial ? Colors.keyDefault : getKeyColor(status);
            const specialWidth = key === 'ENTER' ? keyWidth * 1.5 : key === 'BACK' ? keyWidth * 1.5 : keyWidth;

            return (
              <Pressable
                key={key}
                onPress={() => onPress(key)}
                style={({ pressed }) => [
                  styles.key,
                  {
                    width: specialWidth,
                    height: keyHeight,
                    backgroundColor: bgColor,
                    opacity: pressed ? 0.7 : 1,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                  },
                ]}
                testID={`key-${key}`}
              >
                {key === 'BACK' ? (
                  <Ionicons name="backspace-outline" size={20} color={Colors.white} />
                ) : (
                  <Text style={[
                    styles.keyText,
                    isSpecial && styles.specialKeyText,
                    { fontSize: isSpecial ? 10 : 14 },
                  ]}>
                    {key}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 3,
    gap: 4,
  },
  key: {
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    color: Colors.white,
    fontWeight: '700',
    fontFamily: 'Inter_600SemiBold',
  },
  specialKeyText: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
