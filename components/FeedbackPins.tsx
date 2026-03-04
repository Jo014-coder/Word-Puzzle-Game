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

const FEEDBACK_STYLE = {
  green: Colors.correctPeg,
  yellow: Colors.misplacedPeg,
  grey: Colors.wrongPeg,
  borderColor: 'rgba(255,255,255,0.15)',
  borderWidth: 1,
  shadowColor: 'transparent',
  shadowRadius: 0,
};

function FeedbackPin({ peg, index, pinSize, animated, style }: {
  peg: FeedbackPeg; index: number; pinSize: number; animated: boolean;
  style: typeof FEEDBACK_STYLE;
}) {
  const scale = useSharedValue(animated ? 0 : 1);

  useEffect(() => {
    if (animated) {
      scale.value = withDelay(index * 150, withSpring(1, { damping: 6, stiffness: 200 }));
    }
  }, [animated]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const color = peg === 'green' ? style.green : peg === 'yellow' ? style.yellow : style.grey;
  const hasShadow = style.shadowRadius > 0 && peg !== 'grey';

  return (
    <Animated.View
      style={[
        {
          width: pinSize,
          height: pinSize,
          borderRadius: pinSize / 2,
          backgroundColor: color,
          marginHorizontal: 2,
          borderWidth: style.borderWidth,
          borderColor: style.borderColor,
        },
        hasShadow && {
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: style.shadowRadius,
          elevation: 4,
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
  const style = FEEDBACK_STYLE;

  return (
    <View style={styles.container}>
      {feedback.map((peg, i) => (
        <FeedbackPin
          key={i}
          peg={peg}
          index={i}
          pinSize={pinSize}
          animated={animated}
          style={style}
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
