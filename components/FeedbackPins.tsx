import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { FeedbackPeg } from '@/contexts/GameContext';

const PEG_COLOR_MAP: Record<FeedbackPeg, string> = {
  green: Colors.correctPeg,
  yellow: Colors.misplacedPeg,
  grey: Colors.wrongPeg,
};

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
  feedback: FeedbackPeg[];
  pinSize?: number;
  animated?: boolean;
}

export default function FeedbackPins({ feedback, pinSize = 10, animated = false }: FeedbackPinsProps) {
  const sorted = [...feedback].sort((a, b) => {
    const order: Record<FeedbackPeg, number> = { green: 0, yellow: 1, grey: 2 };
    return order[a] - order[b];
  });

  const total = sorted.length;
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
                color={PEG_COLOR_MAP[sorted[idx]]}
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
