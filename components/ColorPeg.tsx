import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
  /** Force the plain look (used for the logo), ignoring shop pin styles and symbols. */
  plain?: boolean;
}

export default function ColorPeg({ colorIndex, size, selected, onPress, disabled, goldBorder, plain }: ColorPegProps) {
  const { activePinStyle, symbolsOn } = useGame();
  const pinStyle = plain ? PEG_STYLES.default : (PEG_STYLES[activePinStyle] || PEG_STYLES.default);
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

  const filled = colorIndex !== null;
  const bgColor = filled ? Colors.pegs[colorIndex] : 'transparent';
  const borderColor = selected
    ? Colors.accentGlow
    : goldBorder
      ? '#FFD700'
      : filled
        ? pinStyle.borderHighlight
        : Colors.border;

  const hasGlow = filled && pinStyle.glowColor && pinStyle.glowRadius > 0;
  const inner = size - 6;

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
            borderWidth: selected ? 3 : 2,
            backgroundColor: filled ? 'transparent' : 'rgba(255,255,255,0.04)',
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
        {filled ? (
          <View style={{ width: inner, height: inner, borderRadius: inner / 2, overflow: 'hidden', backgroundColor: bgColor }}>
            {/* Soft top light and bottom shade give the peg a rounded, glossy look. */}
            <LinearGradient
              colors={
                pinStyle.shimmer
                  ? ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.05)', 'rgba(200,200,255,0.25)']
                  : ['rgba(255,255,255,0.38)', 'rgba(255,255,255,0)', 'rgba(0,0,0,0.28)']
              }
              locations={[0, 0.5, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={{
                position: 'absolute',
                top: inner * 0.12,
                left: inner * 0.2,
                width: inner * 0.34,
                height: inner * 0.2,
                borderRadius: inner * 0.1,
                backgroundColor: 'rgba(255,255,255,0.35)',
                transform: [{ rotate: '-25deg' }],
              }}
            />
            {symbolsOn && !plain && (
              <View style={styles.symbolWrap}>
                <MaterialCommunityIcons
                  name={Colors.pegSymbols[colorIndex] as any}
                  size={Math.round(inner * 0.5)}
                  color="rgba(0,0,0,0.6)"
                />
              </View>
            )}
          </View>
        ) : (
          selected ? <View style={[styles.emptyDot, { width: size * 0.18, height: size * 0.18, borderRadius: size * 0.09 }]} /> : null
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  peg: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDot: {
    backgroundColor: Colors.accentGlow,
  },
});
