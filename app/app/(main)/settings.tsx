/**
 * EL-014 — Full Settings Screen
 * EL-027 — Personality configuration UI
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { Screen, Text, Card, Button } from '../../components/ui';
import { Colors } from '../../constants/colors';

type Tone = 'friendly' | 'professional' | 'casual';
type Verbosity = 'concise' | 'normal' | 'detailed';
type WakeMode = 'always_on' | 'smart' | 'manual';

const TONE_LABELS: Record<Tone, string> = {
  friendly: '😊 Amical',
  professional: '💼 Pro',
  casual: '😎 Décontracté',
};

const VERBOSITY_LABELS: Record<Verbosity, string> = {
  concise: 'Concis',
  normal: 'Normal',
  detailed: 'Détaillé',
};

const WAKE_LABELS: Record<WakeMode, string> = {
  always_on: 'Toujours actif',
  smart: 'Intelligent',
  manual: 'Manuel (PTT)',
};

export default function SettingsScreen() {
  const [tone, setTone] = useState<Tone>('friendly');
  const [verbosity, setVerbosity] = useState<Verbosity>('normal');
  const [useTu, setUseTu] = useState(true);
  const [humor, setHumor] = useState(true);
  const [wakeMode, setWakeMode] = useState<WakeMode>('manual');
  const [saveAudio, setSaveAudio] = useState(false);

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Tu veux te déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: () => console.log('logout') },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irréversible. Toutes tes données seront supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => console.log('delete') },
      ],
    );
  };

  const handleExportData = () => {
    Alert.alert('Export RGPD', 'Tes données seront préparées et envoyées par email sous 48h.');
  };

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Compte */}
        <Text variant="caption" style={styles.sectionTitle}>COMPTE</Text>
        <Card>
          <SettingRow label="Prénom" value="Georges" />
          <SettingRow label="Email" value="georges@email.com" />
          <SettingRow label="Abonnement" value="🟢 Pro" />
          <SettingRow label="Renouvellement" value="27/03/2026" last />
        </Card>

        {/* Personnalité */}
        <Text variant="caption" style={styles.sectionTitle}>PERSONNALITÉ</Text>
        <Card>
          <Text variant="caption" color={Colors.textLight} style={styles.fieldLabel}>Ton</Text>
          <View style={styles.segmentedRow}>
            {(['friendly', 'professional', 'casual'] as Tone[]).map((t) => (
              <SegmentButton
                key={t}
                label={TONE_LABELS[t]}
                active={tone === t}
                onPress={() => setTone(t)}
              />
            ))}
          </View>

          <Text variant="caption" color={Colors.textLight} style={styles.fieldLabel}>Verbosité</Text>
          <View style={styles.segmentedRow}>
            {(['concise', 'normal', 'detailed'] as Verbosity[]).map((v) => (
              <SegmentButton
                key={v}
                label={VERBOSITY_LABELS[v]}
                active={verbosity === v}
                onPress={() => setVerbosity(v)}
              />
            ))}
          </View>

          <SettingToggle label="Tutoiement" value={useTu} onToggle={setUseTu} />
          <SettingToggle label="Humour" value={humor} onToggle={setHumor} last />
        </Card>

        {/* Preview */}
        <Card style={styles.previewCard}>
          <Text variant="caption" color={Colors.textLight}>Aperçu</Text>
          <Text variant="body" style={styles.previewText}>
            {tone === 'friendly' && useTu
              ? '« Salut ! 😊 Comment je peux t\'aider aujourd\'hui ? »'
              : tone === 'professional' && !useTu
              ? '« Bonjour. Comment puis-je vous assister ? »'
              : tone === 'casual' && useTu
              ? '« Hey ! Dis-moi tout, qu\'est-ce qu\'il te faut ? »'
              : '« Bonjour ! Comment puis-je t\'aider ? »'}
          </Text>
        </Card>

        {/* Voix */}
        <Text variant="caption" style={styles.sectionTitle}>VOIX & AUDIO</Text>
        <Card>
          <Text variant="caption" color={Colors.textLight} style={styles.fieldLabel}>Wake word "Hey Elio"</Text>
          <View style={styles.segmentedRow}>
            {(['always_on', 'smart', 'manual'] as WakeMode[]).map((m) => (
              <SegmentButton
                key={m}
                label={WAKE_LABELS[m]}
                active={wakeMode === m}
                onPress={() => setWakeMode(m)}
              />
            ))}
          </View>
          <SettingToggle label="Sauvegarder l'audio" value={saveAudio} onToggle={setSaveAudio} last />
        </Card>

        {/* Confidentialité */}
        <Text variant="caption" style={styles.sectionTitle}>CONFIDENTIALITÉ</Text>
        <Card>
          <SettingAction label="📦 Exporter mes données (RGPD)" onPress={handleExportData} />
          <SettingAction label="🧠 Ma mémoire" onPress={() => console.log('memories')} />
          <SettingAction label="🗑️ Supprimer mon compte" onPress={handleDeleteAccount} danger last />
        </Card>

        {/* À propos */}
        <Text variant="caption" style={styles.sectionTitle}>À PROPOS</Text>
        <Card>
          <SettingRow label="Version" value="0.1.0" />
          <SettingAction label="📄 Politique de confidentialité" onPress={() => {}} />
          <SettingAction label="📝 Conditions d'utilisation" onPress={() => {}} />
          <SettingAction label="💬 Contacter le support" onPress={() => {}} last />
        </Card>

        <View style={styles.logoutArea}>
          <Button title="Se déconnecter" onPress={handleLogout} variant="ghost" />
        </View>
      </ScrollView>
    </Screen>
  );
}

// Components

function SettingRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.settingRow, !last && styles.borderBottom]}>
      <Text variant="body">{label}</Text>
      <Text variant="body" color={Colors.textLight}>{value}</Text>
    </View>
  );
}

function SettingToggle({ label, value, onToggle, last }: { label: string; value: boolean; onToggle: (v: boolean) => void; last?: boolean }) {
  return (
    <View style={[styles.settingRow, !last && styles.borderBottom]}>
      <Text variant="body">{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ true: Colors.primary, false: Colors.border }}
        thumbColor={Colors.white}
      />
    </View>
  );
}

function SettingAction({ label, onPress, danger, last }: { label: string; onPress: () => void; danger?: boolean; last?: boolean }) {
  return (
    <View style={[styles.settingRow, !last && styles.borderBottom]}>
      <Text variant="body" color={danger ? Colors.error : Colors.text} style={{ flex: 1 }} onPress={onPress}>
        {label}
      </Text>
    </View>
  );
}

function SegmentButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <View
      style={[styles.segment, active && styles.segmentActive]}
      onTouchEnd={onPress}
    >
      <Text
        variant="caption"
        color={active ? Colors.white : Colors.text}
        style={styles.segmentText}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 60 },
  sectionTitle: { marginTop: 24, marginBottom: 8, marginLeft: 4, letterSpacing: 1, color: Colors.textLight },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  borderBottom: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  fieldLabel: { marginTop: 8, marginBottom: 6 },
  segmentedRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  segment: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: Colors.background },
  segmentActive: { backgroundColor: Colors.primary },
  segmentText: { fontWeight: '600' },
  previewCard: { marginTop: 8, backgroundColor: Colors.background },
  previewText: { marginTop: 6, fontStyle: 'italic' },
  logoutArea: { marginTop: 32, alignItems: 'center' },
});
