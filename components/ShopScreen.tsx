import { View, Text, Pressable, StyleSheet, ScrollView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useGame } from '@/contexts/GameContext';
import { SHOP_ITEMS, SHOP_CATEGORIES, ShopItem } from '@/constants/game';
import Toast from './Toast';

function ShopItemCard({ item, owned, active, canAfford, onPress }: {
  item: ShopItem;
  owned: boolean;
  active: boolean;
  canAfford: boolean;
  onPress: () => void;
}) {
  const isConsumable = item.category === 'consumable';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.itemCard,
        owned && !isConsumable && styles.itemCardOwned,
        active && styles.itemCardActive,
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={[styles.itemIconWrap, active && styles.itemIconWrapActive]}>
        <Ionicons
          name={item.icon as any}
          size={22}
          color={active ? Colors.accent : owned && !isConsumable ? Colors.accentGlow : Colors.textSecondary}
        />
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDesc}>{item.description}</Text>
      </View>
      <View style={styles.itemAction}>
        {owned && !isConsumable ? (
          active ? (
            <View style={styles.activeBadge}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.accent} />
              <Text style={styles.activeBadgeText}>Active</Text>
            </View>
          ) : (
            <View style={styles.equipBadge}>
              <Text style={styles.equipBadgeText}>Equip</Text>
            </View>
          )
        ) : (
          <View style={[styles.buyBadge, !canAfford && styles.buyBadgeDisabled]}>
            <MaterialCommunityIcons
              name="circle-multiple"
              size={13}
              color={canAfford ? Colors.coin : Colors.textMuted}
            />
            <Text style={[styles.buyPrice, !canAfford && styles.buyPriceDisabled]}>
              {item.price}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function ShopScreen() {
  const { coins, ownedItems, activePinStyle, activeBackground, purchaseItem, backToMenu, toastMessage, toastType, clearToast } = useGame();
  const insets = useSafeAreaInsets();
  const webTop = Platform.OS === 'web' ? 67 : 0;
  const webBottom = Platform.OS === 'web' ? 34 : 0;

  const isOwned = (id: string) => ownedItems.includes(id);
  const isActive = (item: ShopItem) => {
    if (item.category === 'pins') return activePinStyle === item.id;
    if (item.category === 'background') return activeBackground === item.id;
    if (item.id === 'extreme') return isOwned('extreme');
    return false;
  };

  const handleItemPress = (item: ShopItem) => {
    const owned = isOwned(item.id);
    const isConsumable = item.category === 'consumable';

    if (owned && !isConsumable) {
      purchaseItem(item.id);
      return;
    }

    if (coins < item.price) {
      purchaseItem(item.id);
      return;
    }

    Alert.alert(
      'Confirm Purchase',
      `Buy ${item.name} for ${item.price} coins?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Buy', onPress: () => purchaseItem(item.id) },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTop }]}>
      <View style={styles.topBar}>
        <Pressable onPress={backToMenu} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.topTitle}>Shop</Text>
        <View style={styles.coinsBadge}>
          <MaterialCommunityIcons name="circle-multiple" size={16} color={Colors.coin} />
          <Text style={styles.coinsText}>{coins}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + webBottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {SHOP_CATEGORIES.map(cat => {
          const items = SHOP_ITEMS.filter(i => i.category === cat.key);
          if (items.length === 0) return null;
          return (
            <View key={cat.key} style={styles.categorySection}>
              <Text style={styles.categoryLabel}>{cat.label}</Text>
              {items.map(item => (
                <ShopItemCard
                  key={item.id}
                  item={item}
                  owned={isOwned(item.id)}
                  active={isActive(item)}
                  canAfford={coins >= item.price}
                  onPress={() => handleItemPress(item)}
                />
              ))}
            </View>
          );
        })}

        <View style={styles.tipSection}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
          <Text style={styles.tipText}>Earn coins by winning games, maintaining streaks, and daily logins.</Text>
        </View>
      </ScrollView>

      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onHide={clearToast} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'Inter_700Bold',
  },
  coinsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  coinsText: {
    color: Colors.coin,
    fontWeight: '700',
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 2,
    marginBottom: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  itemCardOwned: {
    borderColor: 'rgba(162,155,254,0.25)',
  },
  itemCardActive: {
    borderColor: Colors.accent,
    backgroundColor: '#1a1d3a',
  },
  itemIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemIconWrapActive: {
    backgroundColor: 'rgba(108,92,231,0.15)',
  },
  itemInfo: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  itemDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: 'Inter_400Regular',
    lineHeight: 15,
  },
  itemAction: {
    alignItems: 'flex-end',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeBadgeText: {
    fontSize: 11,
    color: Colors.accent,
    fontWeight: '700',
    fontFamily: 'Inter_600SemiBold',
  },
  equipBadge: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  equipBadgeText: {
    fontSize: 11,
    color: Colors.accentGlow,
    fontWeight: '700',
    fontFamily: 'Inter_600SemiBold',
  },
  buyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,217,61,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  buyBadgeDisabled: {
    backgroundColor: Colors.surfaceLight,
  },
  buyPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.coin,
    fontFamily: 'Inter_700Bold',
  },
  buyPriceDisabled: {
    color: Colors.textMuted,
  },
  tipSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  tipText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: 'Inter_400Regular',
    flex: 1,
    lineHeight: 17,
  },
});
