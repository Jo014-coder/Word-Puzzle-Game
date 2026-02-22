import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';

interface ColorPegProps {
  colorIndex: number | null;
  size: number;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  goldBorder?: boolean;
}

export default function ColorPeg({ colorIndex, size, selected, onPress, disabled, goldBorder }: ColorPegProps) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    if (disabled) return;
    scale.value = withSequence(
      withSpring(1.15, { damping: 8 }),
      withSpring(1, { damping: 8 })
    );
    onPress?.();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const bgColor = colorIndex !== null ? Colors.pegs[colorIndex] : 'transparent';
  const borderColor = selected ? Colors.accentGlow : (goldBorder ? '#FFD700' : (colorIndex !== null ? 'transparent' : Colors.borderLight));

  return (
    <Pressable onPress={handlePress} disabled={disabled}>
      <Animated.View
        style={[
          styles.peg,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor,
            borderWidth: selected ? 3 : (colorIndex !== null || goldBorder ? 2 : 2),
            borderStyle: colorIndex === null && !selected ? 'dashed' : 'solid',
          },
          animatedStyle,
        ]}
      >
        {colorIndex !== null ? (
          <LinearGradient
            colors={[
              'rgba(255,255,255,0.35)',
              bgColor,
              'rgba(0,0,0,0.15)',
            ]}
            locations={[0, 0.45, 1]}
            start={{ x: 0.3, y: 0 }}
            end={{ x: 0.7, y: 1 }}
            style={[styles.gradient, { borderRadius: (size - 6) / 2 }]}
          />
        ) : (
          <View style={[styles.emptyDot, { width: size * 0.25, height: size * 0.25, borderRadius: size * 0.125 }]} />
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  peg: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    margin: 2,
  },
  emptyDot: {
    backgroundColor: Colors.borderLight,
  },
});
