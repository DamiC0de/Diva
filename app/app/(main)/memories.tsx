/**
 * EL-028 — Memory Management Screen (RGPD)
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, FlatList, TextInput, TouchableOpacity, Alert, StyleSheet,
} from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { Text } from '../../components/ui/Text';
import { colors } from '../../constants/colors';
import { api } from '../../lib/api';

interface Memory {
  id: string;
  category: 'preference' | 'fact' | 'person' | 'event' | 'reminder';
  content: string;
  created_at: string;
}

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  preference: { label: 'Préférences', icon: '⭐' },
  fact: { label: 'Faits', icon: '📌' },
  person: { label: 'Personnes', icon: '👤' },
  event: { label: 'Événements', icon: '📅' },
  reminder: { label: 'Rappels', icon: '🔔' },
};

export default function MemoriesScreen() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadMemories = useCallback(async () => {
    try {
      const res = await api.get('/api/v1/memories');
      setMemories(res.data?.memories || []);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMemories(); }, [loadMemories]);

  const handleDelete = (memory: Memory) => {
    Alert.alert(
      'Supprimer',
      `Oublier : "${memory.content.slice(0, 50)}..." ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/v1/memories/${memory.id}`);
              setMemories(prev => prev.filter(m => m.id !== memory.id));
            } catch {
              Alert.alert('Erreur', 'Impossible de supprimer');
            }
          },
        },
      ],
    );
  };

  const handleEdit = (memory: Memory) => {
    Alert.prompt(
      'Modifier',
      'Nouveau contenu :',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Sauvegarder',
          onPress: async (newContent?: string) => {
            if (!newContent?.trim()) return;
            try {
              await api.patch(`/api/v1/memories/${memory.id}`, { content: newContent });
              setMemories(prev => prev.map(m => m.id === memory.id ? { ...m, content: newContent } : m));
            } catch {
              Alert.alert('Erreur', 'Impossible de modifier');
            }
          },
        },
      ],
      'plain-text',
      memory.content,
    );
  };

  const filtered = memories.filter(m =>
    !search || m.content.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = Object.entries(CATEGORY_LABELS).map(([cat, info]) => ({
    ...info,
    category: cat,
    data: filtered.filter(m => m.category === cat),
  })).filter(g => g.data.length > 0);

  return (
    <Screen>
      <TextInput
        style={styles.search}
        placeholder="🔍 Rechercher dans les souvenirs..."
        placeholderTextColor="#aaa"
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={grouped}
        keyExtractor={(item) => item.category}
        renderItem={({ item: group }) => (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{group.icon} {group.label} ({group.data.length})</Text>
            {group.data.map(memory => (
              <View key={memory.id} style={styles.memoryCard}>
                <Text style={styles.memoryText}>{memory.content}</Text>
                <Text style={styles.memoryDate}>
                  {new Date(memory.created_at).toLocaleDateString('fr-FR')}
                </Text>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => handleEdit(memory)}>
                    <Text style={styles.editBtn}>✏️ Modifier</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(memory)}>
                    <Text style={styles.deleteBtn}>🗑️ Supprimer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {loading ? 'Chargement...' : 'Aucun souvenir pour l\'instant 🧠'}
            </Text>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { margin: 16, height: 44, borderWidth: 1, borderColor: '#ddd', borderRadius: 12, paddingHorizontal: 16, fontSize: 16, backgroundColor: '#fff' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.primary, paddingHorizontal: 16, paddingVertical: 8 },
  memoryCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, padding: 14, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: colors.accent },
  memoryText: { fontSize: 15, color: '#1a1a1a', lineHeight: 22 },
  memoryDate: { fontSize: 12, color: '#aaa', marginTop: 6 },
  actions: { flexDirection: 'row', gap: 16, marginTop: 8 },
  editBtn: { fontSize: 13, color: colors.secondary },
  deleteBtn: { fontSize: 13, color: '#e74c3c' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, color: '#888' },
});
