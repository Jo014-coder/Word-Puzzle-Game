import { View, Text, Pressable, StyleSheet, Modal, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useGame } from '@/contexts/GameContext';
import { hasPrivacyOptions, openPrivacyOptions } from '@/lib/ads';

interface Props {
  visible: boolean;
  onClose: () => void;
  onHowToPlay: () => void;
}

export default function SettingsModal({ visible, onClose, onHowToPlay }: Props) {
  const { soundOn, symbolsOn, toggleSound, toggleSymbols } = useGame();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.row}>
            <Ionicons name={soundOn ? 'volume-high' : 'volume-mute'} size={20} color={Colors.textSecondary} />
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Sound effects</Text>
            </View>
            <Switch value={soundOn} onValueChange={toggleSound} trackColor={{ true: Colors.accent, false: Colors.border }} thumbColor="#fff" {...({ activeThumbColor: "#fff" } as any)} />
          </View>

          <View style={styles.row}>
            <Ionicons name="shapes" size={20} color={Colors.textSecondary} />
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Colour blind mode</Text>
              <Text style={styles.rowHint}>Adds a shape to every colour</Text>
            </View>
            <Switch value={symbolsOn} onValueChange={toggleSymbols} trackColor={{ true: Colors.accent, false: Colors.border }} thumbColor="#fff" {...({ activeThumbColor: "#fff" } as any)} />
          </View>

          <Pressable style={styles.row} onPress={() => { onClose(); onHowToPlay(); }}>
            <Ionicons name="help-circle-outline" size={20} color={Colors.textSecondary} />
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>How to play</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Pressable>

          {hasPrivacyOptions() && (
            <Pressable style={styles.row} onPress={() => { onClose(); openPrivacyOptions(); }}>
              <Ionicons name="shield-checkmark-outline" size={20} color={Colors.textSecondary} />
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>Privacy choices</Text>
                <Text style={styles.rowHint}>Change your ad consent</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </Pressable>
          )}
        </Pressable>
      </Pressable>
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
    padding: 20,
    width: '100%',
    maxWidth: 380,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  rowText: { flex: 1 },
  rowLabel: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  rowHint: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
    marginTop: 2,
  },
});
