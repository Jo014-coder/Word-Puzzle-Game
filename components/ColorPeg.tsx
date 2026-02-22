import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';

interface ColorPegProps {
  colorIndex: number | null;
  size: number;
  selected?: boolean;
  onPress?: () => void;
  showBorder?: boolean;
  disabled?: boolean;
}

export default function ColorPeg({ colorIndex, size, selected, onPress, showBorder = true, disabled }: ColorPegProps) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    if (disabled) return;
    scale.value = withSequence(
      withSpring(1.2, { damping: 8 }),
      withSpring(1, { damping: 8 })
    );
    onPress?.();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const bgColor = colorIndex !== null ? Colors.pegs[colorIndex] : 'transparent';
  const borderColor = selected ? Colors.accentGlow : (colorIndex !== null ? 'transparent' : Colors.borderLight);

  return (
    <Pressable onPress={handlePress} disabled={disabled}>
      <Animated.View
        style={[
          styles.peg,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bgColor,
            borderColor,
            borderWidth: selected ? 3 : (showBorder ? 2 : 0),
          },
          animatedStyle,
        ]}
      >
        {colorIndex === null && (
          <View style={[styles.innerDot, { width: size * 0.3, height: size * 0.3, borderRadius: size * 0.15 }]} />
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  peg: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  innerDot: {
    backgroundColor: Colors.border,
  },
});
