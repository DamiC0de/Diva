/**
 * DIVA Settings Screen — Modern Dark Design
 */
import React, { useState, useCallback } from 'react';
import {
  ScrollView, View, Text, Switch, TouchableOpacity,
  StyleSheet, Alert, Linking, Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Mic, Repeat, Smile, Zap, MessageSquare,
  Mail, Send, Brain, Trash2, Download, LogOut, Info,
  ChevronRight, ChevronDown, Check
} from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import { useSettings } from '../../hooks/useSettings';
import { useTheme } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { api, API_BASE_URL } from '../../lib/api';
import { clearTokens as clearGmailTokens } from '../../lib/gmail';

// ─── Tiny components ────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <Text style={[s.sectionLabel, { color: theme.textMuted }]}>
      {text.toUpperCase()}
    </Text>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.border + '40' }]}>{children}</View>;
}

function Separator() {
  const theme = useTheme();
  return <View style={[s.sep, { backgroundColor: theme.border + '30' }]} />;
}

function ToggleRow({
  icon, label, sub, value, onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  const theme = useTheme();
  return (
    <View style={s.row}>
      <View style={[s.iconWrap, { backgroundColor: theme.primary + '18' }]}>{icon}</View>
      <View style={s.rowText}>
        <Text style={[s.rowLabel, { color: theme.text }]}>{label}</Text>
        {sub && <Text style={[s.rowSub, { color: theme.textMuted }]}>{sub}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: theme.border, true: theme.primary }}
        thumbColor="#fff"
        ios_backgroundColor={theme.border}
      />
    </View>
  );
}

function ActionRow({
  icon, label, sub, value, onPress, danger, last,
}: {
  icon?: React.ReactNode;
  label: string;
  sub?: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  const theme = useTheme();
  const color = danger ? theme.error : theme.text;
  return (
    <TouchableOpacity
      style={s.row}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.6}
    >
      {icon && (
        <View style={[s.iconWrap, { backgroundColor: (danger ? theme.error : theme.primary) + '18' }]}>
          {icon}
        </View>
      )}
      <View style={s.rowText}>
        <Text style={[s.rowLabel, { color }]}>{label}</Text>
        {sub && <Text style={[s.rowSub, { color: theme.textMuted }]}>{sub}</Text>}
      </View>
      {value && <Text style={[s.rowValue, { color: theme.textSecondary }]}>{value}</Text>}
      {onPress && <ChevronRight size={16} color={theme.textMuted} />}
    </TouchableOpacity>
  );
}

function SegmentRow({
  icon, label, options, selected, onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  const theme = useTheme();
  return (
    <View style={s.segmentContainer}>
      <View style={s.row}>
        <View style={[s.iconWrap, { backgroundColor: theme.primary + '18' }]}>{icon}</View>
        <Text style={[s.rowLabel, { color: theme.text }]}>{label}</Text>
      </View>
      <View style={[s.segmentBar, { backgroundColor: theme.bg }]}>
        {options.map((opt, i) => {
          const active = selected === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[
                s.segmentBtn,
                active && { backgroundColor: theme.primary },
                i === 0 && s.segmentFirst,
                i === options.length - 1 && s.segmentLast,
              ]}
              onPress={() => onSelect(opt.value)}
              activeOpacity={0.7}
            >
              <Text style={[s.segmentText, { color: active ? '#fff' : theme.textSecondary }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Main screen ────────────────────────────────────────────────────────────

const TONE_OPTIONS = [
  { label: 'Amical', value: 'friendly' },
  { label: 'Pro', value: 'professional' },
  { label: 'Décontracté', value: 'casual' },
];

const VERBOSITY_OPTIONS = [
  { label: 'Concis', value: 'concise' },
  { label: 'Normal', value: 'normal' },
  { label: 'Détaillé', value: 'detailed' },
];

const WAKE_OPTIONS = [
  { label: 'Manuel', value: 'manual' },
  { label: 'Intelligent', value: 'smart' },
  { label: 'Toujours', value: 'always_on' },
];

export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { settings, updatePersonality, updateSetting } = useSettings();

  const [gmailEmail, setGmailEmail] = useState<string | null>(null);
  const [telegramUsername, setTelegramUsername] = useState<string | null>(null);
  const [statusLoaded, setStatusLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!statusLoaded) {
        (async () => {
          try {
            const [g, t] = await Promise.allSettled([
              api.get<{ email?: string }>('/api/v1/gmail/status'),
              api.get<{ username?: string }>('/api/v1/telegram/status'),
            ]);
            if (g.status === 'fulfilled') setGmailEmail(g.value.data?.email || null);
            if (t.status === 'fulfilled') setTelegramUsername(t.value.data?.username || null);
          } catch { /* silent */ }
          setStatusLoaded(true);
        })();
      }
    }, [statusLoaded])
  );

  const handleGmailConnect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return Alert.alert('Erreur', 'Non connecté');
      await WebBrowser.openBrowserAsync(`${API_BASE_URL}/api/v1/gmail/auth?userId=${user.id}`);
      setStatusLoaded(false);
    } catch (e) { Alert.alert('Erreur', String(e)); }
  };

  const handleGmailDisconnect = () =>
    Alert.alert('Déconnecter Gmail', '', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: async () => {
        await clearGmailTokens();
        try { await api.delete('/api/v1/gmail/disconnect'); } catch { /* silent */ }
        setGmailEmail(null);
      }},
    ]);

  const handleTelegramConnect = async () => {
    try {
      const res = await api.get<{ auth_url: string }>('/api/v1/telegram/auth');
      if (res.data?.auth_url) Linking.openURL(res.data.auth_url);
    } catch { Alert.alert('Erreur', 'Connexion Telegram impossible'); }
  };

  const handleTelegramDisconnect = () =>
    Alert.alert('Déconnecter Telegram', '', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: async () => {
        try { await api.post('/api/v1/telegram/disconnect', {}); } catch { /* silent */ }
        setTelegramUsername(null);
      }},
    ]);

  const handleLogout = () =>
    Alert.alert('Déconnexion', 'Tu veux vraiment te déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: async () => {
        await supabase.auth.signOut();
        router.replace('/(auth)/login');
      }},
    ]);

  const handleDeleteAccount = () =>
    Alert.alert('Supprimer le compte', 'Action irréversible. Toutes tes données seront supprimées.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try {
          await api.delete('/api/v1/user/delete');
          await supabase.auth.signOut();
          router.replace('/(auth)/login');
        } catch { Alert.alert('Erreur', 'Impossible de supprimer'); }
      }},
    ]);

  return (
    <ScrollView
      style={[s.scroll, { backgroundColor: theme.bg }]}
      contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Text style={[s.title, { color: theme.text }]}>Paramètres</Text>
      </View>

      {/* Personnalité */}
      <SectionLabel text="Personnalité" />
      <Card>
        <SegmentRow
          icon={<MessageSquare size={16} color={theme.primary} />}
          label="Ton"
          options={TONE_OPTIONS}
          selected={settings.personality.tone}
          onSelect={(v) => updatePersonality('tone', v as any)}
        />
        <Separator />
        <SegmentRow
          icon={<Zap size={16} color={theme.primary} />}
          label="Verbosité"
          options={VERBOSITY_OPTIONS}
          selected={settings.personality.verbosity}
          onSelect={(v) => updatePersonality('verbosity', v as any)}
        />
        <Separator />
        <ToggleRow
          icon={<Smile size={16} color={theme.primary} />}
          label="Humour"
          sub="Diva peut être drôle"
          value={settings.personality.humor}
          onToggle={(v) => updatePersonality('humor', v)}
        />
      </Card>

      {/* Voix */}
      <SectionLabel text="Voix & Écoute" />
      <Card>
        <SegmentRow
          icon={<Mic size={16} color={theme.primary} />}
          label="Activation"
          options={WAKE_OPTIONS}
          selected={settings.voice.wake_word_mode}
          onSelect={(v) => updateSetting('voice', { ...settings.voice, wake_word_mode: v as any })}
        />
        <Separator />
        <ToggleRow
          icon={<Repeat size={16} color={theme.primary} />}
          label="Mode conversation"
          sub="Continue d'écouter après chaque réponse"
          value={settings.voice.conversationMode}
          onToggle={(v) => updateSetting('voice', { ...settings.voice, conversationMode: v })}
        />
      </Card>

      {/* Services */}
      <SectionLabel text="Services connectés" />
      <Card>
        <ActionRow
          icon={<Mail size={16} color={theme.primary} />}
          label="Gmail"
          value={gmailEmail ? `✓ ${gmailEmail}` : 'Connecter'}
          onPress={gmailEmail ? handleGmailDisconnect : handleGmailConnect}
        />
        <Separator />
        <ActionRow
          icon={<Send size={16} color={theme.primary} />}
          label="Telegram"
          value={telegramUsername ? `✓ @${telegramUsername}` : 'Connecter'}
          onPress={telegramUsername ? handleTelegramDisconnect : handleTelegramConnect}
          last
        />
      </Card>

      {/* Confidentialité */}
      <SectionLabel text="Confidentialité" />
      <Card>
        <ActionRow
          icon={<Brain size={16} color={theme.primary} />}
          label="Mes souvenirs"
          onPress={async () => {
            try {
              const res = await api.get<{ memories?: { content: string }[] }>('/api/v1/memories');
              const m = res.data?.memories || [];
              Alert.alert(`${m.length} souvenir(s)`, m.slice(0, 5).map(x => `• ${x.content}`).join('\n') || 'Aucun souvenir');
            } catch { Alert.alert('Erreur', 'Impossible de charger'); }
          }}
        />
        <Separator />
        <ActionRow
          icon={<Trash2 size={16} color={theme.error} />}
          label="Effacer mes souvenirs"
          onPress={() => Alert.alert('Effacer les souvenirs', '', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Effacer', style: 'destructive', onPress: async () => {
              try { await api.delete('/api/v1/memories'); Alert.alert('✓', 'Effacé'); } catch { /* silent */ }
            }},
          ])}
          danger
          last
        />
      </Card>

      {/* Compte */}
      <SectionLabel text="Compte" />
      <Card>
        <ActionRow
          icon={<Info size={16} color={theme.primary} />}
          label="Version"
          value="1.0.0 (v24)"
        />
        <Separator />
        <ActionRow
          icon={<Trash2 size={16} color={theme.error} />}
          label="Supprimer mon compte"
          onPress={handleDeleteAccount}
          danger
          last
        />
      </Card>

      {/* Déconnexion */}
      <TouchableOpacity
        style={[s.logoutBtn, { backgroundColor: theme.error + '15', borderColor: theme.error + '30' }]}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <LogOut size={18} color={theme.error} />
        <Text style={[s.logoutText, { color: theme.error }]}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },

  sectionLabel: {
    fontSize: 11, fontWeight: '600', letterSpacing: 1,
    marginBottom: 8, marginTop: 24, marginLeft: 4,
  },

  card: {
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 4,
  },

  sep: { height: StyleSheet.hairlineWidth, marginLeft: 52 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 13, minHeight: 54,
  },
  iconWrap: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '500' },
  rowSub: { fontSize: 12, marginTop: 1 },
  rowValue: { fontSize: 13, marginRight: 4 },

  segmentContainer: {
    paddingHorizontal: 14, paddingTop: 13, paddingBottom: 10,
  },
  segmentBar: {
    flexDirection: 'row', borderRadius: 10, overflow: 'hidden',
    marginTop: 10, marginLeft: 42,
  },
  segmentBtn: {
    flex: 1, paddingVertical: 7, alignItems: 'center',
  },
  segmentFirst: { borderRadius: 10, borderTopRightRadius: 0, borderBottomRightRadius: 0 },
  segmentLast: { borderRadius: 10, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
  segmentText: { fontSize: 12, fontWeight: '600' },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 28, borderRadius: 14, paddingVertical: 14,
    borderWidth: 1,
  },
  logoutText: { fontSize: 16, fontWeight: '600' },
});
