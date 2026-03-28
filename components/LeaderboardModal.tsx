import { View, Text, Modal, Pressable, StyleSheet, FlatList, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { DIFFICULTY_CONFIG } from '@/constants/game';
import { useGame, LeaderboardEntry } from '@/contexts/GameContext';

function RankBadge({ rank }: { rank: number }) {
  const gold = rank === 1;
  const silver = rank === 2;
  const bronze = rank === 3;
  const color = gold ? '#FFD93D' : silver ? '#9CA3AF' : bronze ? '#F97316' : Colors.textMuted;
  return (
    <View style={[styles.rankBadge, { borderColor: color }]}>
      <Text style={[styles.rankText, { color }]}>#{rank}</Text>
    </View>
  );
}

function EmptyLeaderboard() {
  return (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="timer-outline" size={48} color={Colors.textMuted} />
      <Text style={styles.emptyTitle}>No scores yet</Text>
      <Text style={styles.emptyDesc}>Play Time Attack to set your first score!</Text>
    </View>
  );
}

function EntryRow({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const diffColor = Colors.difficultyColors[entry.difficulty] || Colors.textMuted;
  const diffLabel = DIFFICULTY_CONFIG[entry.difficulty]?.label || entry.difficulty;
  const dateStr = entry.date.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$3/$2');

  return (
    <View style={styles.entryRow}>
      <RankBadge rank={rank} />
      <View style={styles.entryScore}>
        <Text style={styles.entryScoreValue}>{entry.score}</Text>
        <Text style={styles.entryScoreLabel}>solved</Text>
      </View>
      <View style={styles.entryMeta}>
        <View style={[styles.diffPill, { borderColor: diffColor }]}>
          <Text style={[styles.diffPillText, { color: diffColor }]}>{diffLabel}</Text>
        </View>
        <Text style={styles.entryDate}>{dateStr}</Text>
      </View>
    </View>
  );
}

interface LeaderboardModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function LeaderboardModal({ visible, onClose }: LeaderboardModalProps) {
  const { leaderboard } = useGame();
  const insets = useSafeAreaInsets();
  const webTop = Platform.OS === 'web' ? 67 : 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { paddingTop: Math.max(insets.top + webTop, 20) + 8 }]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MaterialCommunityIcons name="trophy-outline" size={20} color={Colors.coin} />
              <Text style={styles.headerTitle}>Time Attack Leaderboard</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>Your top 10 local scores</Text>

          {leaderboard.length === 0 ? (
            <EmptyLeaderboard />
          ) : (
            <FlatList
              data={leaderboard}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item, index }) => <EntryRow entry={item} rank={index + 1} />}
              style={styles.list}
              contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'Inter_700Bold',
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: 'Inter_400Regular',
    marginBottom: 16,
  },
  list: {
    flexGrow: 0,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
  },
  emptyDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  entryScore: {
    alignItems: 'center',
    minWidth: 44,
  },
  entryScoreValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'Inter_700Bold',
    lineHeight: 26,
  },
  entryScoreLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: 'Inter_400Regular',
  },
  entryMeta: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 4,
  },
  diffPill: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  diffPillText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  entryDate: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: 'Inter_400Regular',
  },
});
