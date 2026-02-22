import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { Feedback } from '@/contexts/GameContext';

function FeedbackPin({ color, index, pinSize, animated }: { color: string; index: number; pinSize: number; animated: boolean }) {
  const scale = useSharedValue(animated ? 0 : 1);

  useEffect(() => {
    if (animated) {
      scale.value = withDelay(index * 150, withSpring(1, { damping: 6, stiffness: 200 }));
    }
  }, [animated]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: pinSize,
          height: pinSize,
          borderRadius: pinSize / 2,
          backgroundColor: color,
          margin: 1.5,
        },
        animStyle,
      ]}
    />
  );
}

interface FeedbackPinsProps {
  feedback: Feedback;
  total: number;
  pinSize?: number;
  animated?: boolean;
}

export default function FeedbackPins({ feedback, total, pinSize = 10, animated = false }: FeedbackPinsProps) {
  const pinColors: string[] = [];
  for (let i = 0; i < feedback.exact; i++) pinColors.push(Colors.correctPeg);
  for (let i = 0; i < feedback.misplaced; i++) pinColors.push(Colors.misplacedPeg);
  for (let i = 0; i < feedback.wrong; i++) pinColors.push(Colors.wrongPeg);

  const cols = Math.ceil(total / 2);

  return (
    <View style={styles.container}>
      {[0, 1].map(rowIdx => (
        <View key={rowIdx} style={styles.row}>
          {Array.from({ length: cols }, (_, colIdx) => {
            const idx = rowIdx * cols + colIdx;
            if (idx >= total) return <View key={colIdx} style={{ width: pinSize, height: pinSize, margin: 1.5 }} />;
            return (
              <FeedbackPin
                key={colIdx}
                color={pinColors[idx] || Colors.wrongPeg}
                index={idx}
                pinSize={pinSize}
                animated={animated}
              />
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
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
  },
});
