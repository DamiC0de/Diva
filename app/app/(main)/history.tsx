/**
 * History Screen — 2026 Design
 * Clean conversation history with swipe-to-delete
 */
import React, { useRef } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { Text } from '../../components/ui/Text';
import { Screen } from '../../components/ui/Screen';
import { useHistory, HistoryEntry } from '../../hooks/useHistory';
import { useTheme } from '../../constants/theme';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { User, Sparkles, Trash2, MessageCircle } from 'lucide-react-native';

const DELETE_THRESHOLD = 80;

interface SwipeableItemProps {
  item: HistoryEntry;
  onDelete: (id: string) => void;
  theme: ReturnType<typeof useTheme>;
}

function SwipeableItem({ item, onDelete, theme }: SwipeableItemProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const panX = useRef(0);

  const handleTouchStart = (e: any) => {
    panX.current = e.nativeEvent.pageX;
  };

  const handleTouchMove = (e: any) => {
    const diff = e.nativeEvent.pageX - panX.current;
    if (diff < 0) {
      translateX.setValue(Math.max(diff, -DELETE_THRESHOLD));
    }
  };

  const handleTouchEnd = () => {
    const currentValue = (translateX as any)._value;
    if (currentValue < -DELETE_THRESHOLD / 2) {
      Animated.spring(translateX, {
        toValue: -DELETE_THRESHOLD,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer',
      'Supprimer cette conversation ?',
      [
        { text: 'Annuler', style: 'cancel', onPress: () => {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }},
        { text: 'Supprimer', style: 'destructive', onPress: () => onDelete(item.id) },
      ]
    );
  };

  const truncate = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <View style={styles.swipeContainer}>
      {/* Delete background */}
      <TouchableOpacity 
        style={[styles.deleteAction, { backgroundColor: theme.error }]}
        onPress={handleDelete}
        activeOpacity={0.8}
      >
        <Trash2 size={22} color="#fff" />
      </TouchableOpacity>
      
      {/* Swipeable content */}
      <Animated.View
        style={[
          styles.itemWrapper,
          { transform: [{ translateX }] },
        ]}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <View style={[styles.item, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          {/* Timestamp */}
          <Text style={[styles.time, { color: theme.textMuted }]}>
            {formatDistanceToNow(item.timestamp, { addSuffix: true, locale: fr })}
          </Text>
          
          {/* User message */}
          <View style={styles.messageRow}>
            <View style={[styles.iconBadge, { backgroundColor: theme.bgSecondary }]}>
              <User size={14} color={theme.textSecondary} />
            </View>
            <Text style={[styles.messageText, { color: theme.text }]} numberOfLines={2}>
              {truncate(item.userText, 100)}
            </Text>
          </View>
          
          {/* Assistant response */}
          <View style={[styles.messageRow, styles.assistantRow]}>
            <View style={[styles.iconBadge, { backgroundColor: theme.primary + '20' }]}>
              <Sparkles size={14} color={theme.primary} />
            </View>
            <Text style={[styles.messageText, { color: theme.textSecondary }]} numberOfLines={2}>
              {truncate(item.assistantText, 150)}
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

export default function HistoryScreen() {
  const theme = useTheme();
  const { history, remove, clear, loading } = useHistory();

  const handleClearAll = () => {
    if (history.length === 0) return;
    
    Alert.alert(
      'Tout effacer',
      'Supprimer tout l\'historique ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Effacer', style: 'destructive', onPress: clear },
      ]
    );
  };

  const renderItem = ({ item }: { item: HistoryEntry }) => (
    <SwipeableItem item={item} onDelete={remove} theme={theme} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.card }]}>
        <MessageCircle size={32} color={theme.textMuted} />
      </View>
      <Text style={[styles.emptyText, { color: theme.text }]}>
        Aucune conversation
      </Text>
      <Text style={[styles.emptySubtext, { color: theme.textMuted }]}>
        Tes échanges avec Diva apparaîtront ici
      </Text>
    </View>
  );

  const renderHeader = () => {
    if (history.length === 0) return null;
    
    return (
      <View style={[styles.header, { borderBottomColor: theme.divider }]}>
        <Text style={[styles.headerText, { color: theme.textSecondary }]}>
          {history.length} conversation{history.length > 1 ? 's' : ''}
        </Text>
        <TouchableOpacity onPress={handleClearAll} activeOpacity={0.7}>
          <Text style={[styles.clearText, { color: theme.error }]}>
            Tout effacer
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <Screen>
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
          <Text style={[styles.loadingText, { color: theme.textMuted }]}>
            Chargement...
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={history.length === 0 ? styles.emptyList : styles.list}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingBottom: 32,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  clearText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  swipeContainer: {
    position: 'relative',
    marginHorizontal: 16,
    marginTop: 12,
  },
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_THRESHOLD,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  itemWrapper: {
    backgroundColor: 'transparent',
  },
  item: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  time: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginBottom: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  assistantRow: {
    marginTop: 10,
  },
  iconBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  messageText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 21,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
});
