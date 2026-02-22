import { View, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
import { Feedback } from '@/contexts/GameContext';

interface FeedbackPinsProps {
  feedback: Feedback;
  total: number;
  pinSize?: number;
}

export default function FeedbackPins({ feedback, total, pinSize = 10 }: FeedbackPinsProps) {
  const pins: string[] = [];

  for (let i = 0; i < feedback.exact; i++) pins.push(Colors.correct);
  for (let i = 0; i < feedback.misplaced; i++) pins.push(Colors.misplaced);
  while (pins.length < total) pins.push(Colors.wrong);

  const rows = Math.ceil(total / 2);

  return (
    <View style={styles.container}>
      {Array.from({ length: rows }, (_, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {[0, 1].map(colIdx => {
            const idx = rowIdx * 2 + colIdx;
            if (idx >= total) return <View key={colIdx} style={{ width: pinSize, height: pinSize, margin: 1 }} />;
            return (
              <View
                key={colIdx}
                style={[
                  styles.pin,
                  {
                    width: pinSize,
                    height: pinSize,
                    borderRadius: pinSize / 2,
                    backgroundColor: pins[idx],
                    margin: 1,
                  },
                ]}
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
  pin: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
