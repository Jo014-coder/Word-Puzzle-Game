import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { FeedbackPeg, useGame } from '@/contexts/GameContext';

const PIN_STYLES: Record<string, {
  green: string; yellow: string; grey: string;
  borderColor: string; borderWidth: number;
  shadowColor: string; shadowRadius: number;
}> = {
  default: {
    green: Colors.correctPeg,
    yellow: Colors.misplacedPeg,
    grey: Colors.wrongPeg,
    borderColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    shadowColor: 'transparent',
    shadowRadius: 0,
  },
  pins_neon: {
    green: '#00FF88',
    yellow: '#FFD700',
    grey: '#555577',
    borderColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1.5,
    shadowColor: '#00FF88',
    shadowRadius: 6,
  },
  pins_crystal: {
    green: '#7DFFB3',
    yellow: '#FFE680',
    grey: '#9999BB',
    borderColor: 'rgba(200,200,255,0.5)',
    borderWidth: 2,
    shadowColor: '#A0A0FF',
    shadowRadius: 4,
  },
};

function FeedbackPin({ peg, index, pinSize, animated, style }: {
  peg: FeedbackPeg; index: number; pinSize: number; animated: boolean;
  style: typeof PIN_STYLES.default;
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
  const { activePinStyle } = useGame();
  const style = PIN_STYLES[activePinStyle] || PIN_STYLES.default;

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
