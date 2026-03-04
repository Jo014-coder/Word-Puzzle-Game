import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useGame } from '@/contexts/GameContext';

const PEG_STYLES: Record<string, {
  glowColor: string | null;
  glowRadius: number;
  borderHighlight: string;
  shimmer: boolean;
}> = {
  default: { glowColor: null, glowRadius: 0, borderHighlight: 'transparent', shimmer: false },
  pins_neon: { glowColor: '#00FF88', glowRadius: 8, borderHighlight: 'rgba(0,255,136,0.5)', shimmer: false },
  pins_crystal: { glowColor: '#A0A0FF', glowRadius: 5, borderHighlight: 'rgba(200,200,255,0.6)', shimmer: true },
};

interface ColorPegProps {
  colorIndex: number | null;
  size: number;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  goldBorder?: boolean;
}

export default function ColorPeg({ colorIndex, size, selected, onPress, disabled, goldBorder }: ColorPegProps) {
  const { activePinStyle } = useGame();
  const pinStyle = PEG_STYLES[activePinStyle] || PEG_STYLES.default;
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
  const borderColor = selected ? Colors.accentGlow : (goldBorder ? '#FFD700' : (colorIndex !== null ? (pinStyle.borderHighlight !== 'transparent' ? pinStyle.borderHighlight : 'transparent') : Colors.borderLight));

  const hasGlow = colorIndex !== null && pinStyle.glowColor && pinStyle.glowRadius > 0;

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
          hasGlow && {
            shadowColor: pinStyle.glowColor!,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: pinStyle.glowRadius,
            elevation: 6,
          },
          animatedStyle,
        ]}
      >
        {colorIndex !== null ? (
          <LinearGradient
            colors={
              pinStyle.shimmer
                ? ['rgba(255,255,255,0.5)', bgColor, 'rgba(200,200,255,0.2)']
                : ['rgba(255,255,255,0.35)', bgColor, 'rgba(0,0,0,0.15)']
            }
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
