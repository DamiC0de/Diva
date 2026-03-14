/**
 * MEM-003 — Mes souvenirs — Dedicated memories screen
 * Browse, search, filter, edit and delete memories
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, Pressable, Alert,
  ActivityIndicator, RefreshControl, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Search, Trash2, ChevronLeft, X, Edit3, Check,
  Brain, Heart, MapPin, Users, Target, Star, Calendar, MessageCircle, Lightbulb, Clock,
} from 'lucide-react-native';
import { useTheme } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { api, API_BASE_URL } from '../../lib/api';

interface Memory {
  id: string;
  category: string;
  content: string;
  relevance_score?: number;
  created_at: string;
}

const CATEGORY_META: Record<string, { label: string; color: string; icon: any }> = {
  preference: { label: 'Préférence', color: '#5856D6', icon: Star },
  fact: { label: 'Fait', color: '#007AFF', icon: Brain },
  person: { label: 'Personne', color: '#FF9500', icon: Users },
  event: { label: 'Événement', color: '#34C759', icon: Calendar },
  health: { label: 'Santé', color: '#FF3B30', icon: Heart },
  routine: { label: 'Routine', color: '#AF52DE', icon: Clock },
  location: { label: 'Lieu', color: '#00C7BE', icon: MapPin },
  relationship: { label: 'Relation', color: '#FF2D55', icon: Users },
  opinion: { label: 'Opinion', color: '#FF9F0A', icon: MessageCircle },
  goal: { label: 'Objectif', color: '#30D158', icon: Target },
};

const ALL_CATEGORIES = Object.keys(CATEGORY_META);

export default function MemoriesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const fetchMemories = useCallback(async () => {
    try {
      // Try HTTP first
      const res = await api.get<{ memories: Memory[] }>('/api/v1/memories');
      setMemories(res.data?.memories || []);
    } catch {
      // Fallback to WebSocket
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) return;
        const wsUrl = API_BASE_URL.replace('http', 'ws');
        const ws = new WebSocket(`${wsUrl}/ws?token=${token}`);
        ws.onopen = () => ws.send(JSON.stringify({ type: 'get_memories' }));
        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'memories') {
              setMemories(msg.memories || []);
              ws.close();
            }
          } catch {}
        };
        setTimeout(() => ws.close(), 10000);
      } catch {}
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchMemories(); }, [fetchMemories]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMemories();
  };

  const handleDelete = (memory: Memory) => {
    Alert.alert(
      'Supprimer ce souvenir ?',
      memory.content,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/v1/memories/${memory.id}`);
            } catch {}
            setMemories(prev => prev.filter(m => m.id !== memory.id));
          },
        },
      ],
    );
  };

  const handleEdit = (memory: Memory) => {
    setEditingId(memory.id);
    setEditText(memory.content);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editText.trim()) return;
    try {
      await api.patch(`/api/v1/memories/${id}`, { content: editText.trim() });
      setMemories(prev => prev.map(m => m.id === id ? { ...m, content: editText.trim() } : m));
    } catch {
      Alert.alert('Erreur', 'Impossible de modifier');
    }
    setEditingId(null);
    setEditText('');
  };

  const handleDeleteAll = () => {
    Alert.alert(
      'Tout effacer ?',
      `${memories.length} souvenirs seront supprimés définitivement.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Tout effacer', style: 'destructive',
          onPress: async () => {
            try { await api.delete('/api/v1/memories'); } catch {}
            setMemories([]);
          },
        },
      ],
    );
  };

  // Filter
  const filtered = memories.filter(m => {
    if (selectedCategory && m.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return m.content.toLowerCase().includes(q);
    }
    return true;
  });

  // Count per category
  const categoryCounts = memories.reduce((acc, m) => {
    acc[m.category] = (acc[m.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const renderMemory = ({ item }: { item: Memory }) => {
    const meta = CATEGORY_META[item.category] || CATEGORY_META.fact;
    const Icon = meta.icon;
    const isEditing = editingId === item.id;

    return (
      <View style={[styles.memoryCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={styles.memoryHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: meta.color + '20' }]}>
            <Icon size={12} color={meta.color} />
            <Text style={[styles.categoryLabel, { color: meta.color }]}>{meta.label}</Text>
          </View>
          <Text style={[styles.memoryDate, { color: theme.textMuted }]}>{formatDate(item.created_at)}</Text>
        </View>

        {isEditing ? (
          <View style={styles.editRow}>
            <TextInput
              style={[styles.editInput, { color: theme.text, borderColor: theme.primary }]}
              value={editText}
              onChangeText={setEditText}
              multiline
              autoFocus
            />
            <Pressable onPress={() => handleSaveEdit(item.id)} style={styles.editAction}>
              <Check size={20} color={theme.success} />
            </Pressable>
            <Pressable onPress={() => setEditingId(null)} style={styles.editAction}>
              <X size={20} color={theme.textMuted} />
            </Pressable>
          </View>
        ) : (
          <Text style={[styles.memoryContent, { color: theme.text }]}>{item.content}</Text>
        )}

        {!isEditing && (
          <View style={styles.memoryActions}>
            <Pressable onPress={() => handleEdit(item)} hitSlop={8}>
              <Edit3 size={16} color={theme.textMuted} />
            </Pressable>
            <Pressable onPress={() => handleDelete(item)} hitSlop={8}>
              <Trash2 size={16} color={theme.error} />
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  const isDark = theme.statusBar === 'light';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? [theme.bgGradientStart, theme.bgGradientEnd, '#0D0D18'] : [theme.bgGradientStart, theme.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
        locations={isDark ? [0, 0.5, 1] : [0, 1]}
      />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ChevronLeft size={28} color={theme.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Brain size={20} color={theme.primary} />
            <Text style={[styles.headerTitle, { color: theme.text }]}>Mes souvenirs</Text>
          </View>
          <Pressable onPress={handleDeleteAll} hitSlop={12}>
            <Trash2 size={20} color={theme.error} />
          </Pressable>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Text style={[styles.statsText, { color: theme.textSecondary }]}>
            {memories.length} souvenir{memories.length !== 1 ? 's' : ''}
            {selectedCategory ? ` · ${CATEGORY_META[selectedCategory]?.label}` : ''}
            {searchQuery ? ` · "${searchQuery}"` : ''}
          </Text>
        </View>

        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: theme.bgSecondary, borderColor: theme.border }]}>
          <Search size={18} color={theme.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Rechercher un souvenir..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')}>
              <X size={18} color={theme.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {/* Category filters */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={ALL_CATEGORIES.filter(c => categoryCounts[c])}
          keyExtractor={c => c}
          contentContainerStyle={styles.categoryScroll}
          renderItem={({ item: cat }) => {
            const meta = CATEGORY_META[cat];
            const isActive = selectedCategory === cat;
            return (
              <Pressable
                onPress={() => setSelectedCategory(isActive ? null : cat)}
                style={[
                  styles.categoryChip,
                  { backgroundColor: isActive ? meta.color + '30' : theme.bgSecondary, borderColor: isActive ? meta.color : theme.border },
                ]}
              >
                <Text style={[styles.chipText, { color: isActive ? meta.color : theme.textSecondary }]}>
                  {meta.label} ({categoryCounts[cat]})
                </Text>
              </Pressable>
            );
          }}
        />

        {/* Memory list */}
        {loading ? (
          <ActivityIndicator style={styles.loader} color={theme.primary} size="large" />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={m => m.id}
            renderItem={renderMemory}
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Brain size={48} color={theme.textMuted} />
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                  {searchQuery || selectedCategory ? 'Aucun souvenir trouvé' : 'Aucun souvenir pour l\'instant\nParle à Diva pour qu\'elle apprenne à te connaître !'}
                </Text>
              </View>
            }
          />
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 8,
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  statsRow: { paddingHorizontal: 20, paddingBottom: 8 },
  statsText: { fontSize: 13 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15 },
  categoryScroll: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  categoryChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginRight: 4,
  },
  chipText: { fontSize: 13, fontWeight: '500' },
  listContent: { paddingHorizontal: 16 },
  memoryCard: {
    padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1,
  },
  memoryHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  categoryLabel: { fontSize: 11, fontWeight: '600' },
  memoryDate: { fontSize: 11 },
  memoryContent: { fontSize: 15, lineHeight: 21 },
  memoryActions: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 8,
  },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editInput: {
    flex: 1, fontSize: 15, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  editAction: { padding: 4 },
  loader: { flex: 1, justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 16 },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
