import { View, Text, Pressable, StyleSheet, Modal, ScrollView } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';

const STEPS = [
  {
    emoji: '🎯',
    title: 'Your Goal',
    body: 'Crack the secret colour code! You have a limited number of attempts — the exact number depends on the difficulty you choose.',
  },
  {
    emoji: '🔵',
    title: 'Placing Pegs',
    body: 'Tap a colour from the palette to place it in the current row. Tap again to place the next peg. Use the Clear button to remove the last peg, then tap Submit when your row is full.',
  },
  {
    emoji: '📍',
    title: 'Reading the Feedback',
    body: 'After each guess you get coloured feedback pins:\n\n🟢  Right colour, right position\n🟡  Right colour, wrong position\n⚫  Colour not in the code\n\nUse the clues to narrow it down!',
  },
  {
    emoji: '💀',
    title: 'Extreme Mode',
    body: 'Extreme mode uses 7 pegs and only 4 attempts. One of your feedback pins is also fake — so think carefully before trusting every clue. Unlock it in the Shop.',
  },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function HowToPlayModal({ visible, onClose }: Props) {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setStep(0);
    onClose();
  };

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Pressable onPress={handleClose} style={styles.closeButton} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
            <Ionicons name="close" size={22} color={Colors.textSecondary} />
          </Pressable>

          <Text style={styles.howToPlayLabel}>HOW TO PLAY</Text>

          <Text style={styles.emoji}>{current.emoji}</Text>
          <Text style={styles.title}>{current.title}</Text>
          <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.body}>{current.body}</Text>
          </ScrollView>

          <View style={styles.dots}>
            {STEPS.map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
          </View>

          <Pressable onPress={handleNext} style={({ pressed }) => [styles.nextButton, { opacity: pressed ? 0.8 : 1 }]}>
            <Text style={styles.nextButtonText}>{isLast ? 'Got it!' : 'Next'}</Text>
            {!isLast && <Ionicons name="chevron-forward" size={18} color={Colors.textPrimary} />}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingTop: 44,
    paddingBottom: 28,
    paddingHorizontal: 28,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 16,
    padding: 4,
  },
  howToPlayLabel: {
    position: 'absolute',
    top: 16,
    left: 20,
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 14,
    marginTop: 4,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    marginBottom: 14,
    textAlign: 'center',
  },
  bodyScroll: {
    maxHeight: 140,
    width: '100%',
  },
  bodyContent: {
    paddingBottom: 4,
  },
  body: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.accent,
    width: 20,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 12,
  },
  nextButtonText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
});
