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
          marginHorizontal: 2,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.15)',
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
  return (
    <View style={styles.container}>
      {feedback.map((peg, i) => (
        <FeedbackPin
          key={i}
          color={PEG_COLOR_MAP[peg]}
          index={i}
          pinSize={pinSize}
          animated={animated}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
