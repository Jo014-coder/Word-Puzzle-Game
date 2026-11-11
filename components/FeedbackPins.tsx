import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { FeedbackPeg } from '@/contexts/GameContext';

interface FeedbackPinProps {
  /** null = no feedback yet (keeps the space so rows do not jump). */
  peg: FeedbackPeg | null;
  index: number;
  size: number;
  animated: boolean;
  testID?: string;
}

// One clue marker, shown directly under the peg it describes.
// Each clue has its own shape as well as its own colour, so it can be read without relying on colour:
//   right colour, right place  = solid green dot
//   right colour, wrong place  = hollow yellow ring
//   colour not in the code     = small grey dot
export function FeedbackPin({ peg, index, size, animated, testID }: FeedbackPinProps) {
  const scale = useSharedValue(animated ? 0 : 1);

  useEffect(() => {
    if (animated) {
      // A short, crisp pop that always settles (a loose spring kept wobbling for seconds).
      scale.value = withDelay(index * 110, withSequence(withTiming(1.3, { duration: 140 }), withTiming(1, { duration: 120 })));
    }
  }, [animated]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (peg === null) return <View style={{ width: size, height: size }} />;

  const shape =
    peg === 'green'
      ? { width: size, height: size, borderRadius: size / 2, backgroundColor: Colors.correctBright }
      : peg === 'yellow'
        ? { width: size, height: size, borderRadius: size / 2, borderWidth: Math.max(2.5, size * 0.26), borderColor: Colors.misplacedBright }
        : { width: size * 0.42, height: size * 0.42, borderRadius: size * 0.21, backgroundColor: Colors.wrongPeg };

  return (
    <View testID={testID} accessibilityLabel={peg === 'green' ? 'Right colour, right place' : peg === 'yellow' ? 'Right colour, wrong place' : 'Not in the code'} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[shape, animStyle]} />
    </View>
  );
}
