/**
 * EL-029 — Onboarding Flow — 2026 Design
 * Cloud Dancer + Mermaidcore palette, dark/light adaptive
 */
import React, { useRef, useState } from 'react';
import {
  Image,
  View, FlatList, Dimensions, TextInput, TouchableOpacity,
  StyleSheet, Text,
} from 'react-native';
import { router } from 'expo-router';
import { Audio } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useTheme, type Theme } from '../../constants/theme';

const { width } = Dimensions.get('window');

interface OnboardingData {
  name: string;
  formality: 'tu' | 'vous';
  tone: 'friendly' | 'professional' | 'casual';
}

export default function OnboardingScreen() {
  const theme = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [data, setData] = useState<OnboardingData>({ name: '', formality: 'tu', tone: 'friendly' });
  const insets = useSafeAreaInsets();

  const goNext = () => {
    if (currentPage < 3) {
      flatListRef.current?.scrollToIndex({ index: currentPage + 1 });
      setCurrentPage(currentPage + 1);
    }
  };

  const finish = async () => {
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://72.60.155.227:4000';
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (token) {
        await fetch(`${API_URL}/api/v1/settings`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            settings: {
              personality: { tone: data.tone, formality: data.formality, name_preference: data.name },
              onboarding_completed: true,
            },
          }),
        });
      }
    } catch {}
    router.replace('/(main)');
  };

  const s = makeStyles(theme);

  // --- Page 1: Welcome ---
  const WelcomePage = (
    <View key="welcome" style={s.page}>
      <View style={s.hero}>
        <Image
          source={require('../../../assets/images/diva-logo.png')}
          style={s.logo}
          resizeMode="contain"
        />
        <Text style={s.brand}>diva</Text>
        <Text style={s.tagline}>Ton assistant vocal{'\n'}intelligent</Text>
      </View>
      <View style={s.bottom}>
        <Text style={s.desc}>
          Parle naturellement. Diva comprend ta voix, exécute tes demandes et s'adapte à toi.
        </Text>
        <TouchableOpacity style={s.btn} onPress={goNext} activeOpacity={0.85}>
          <Text style={s.btnText}>Commencer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // --- Page 2: Micro ---
  const MicroPage = (
    <View key="micro" style={s.page}>
      <View style={s.hero}>
        <View style={[s.iconBadge, { backgroundColor: theme.primarySoft }]}>  
          <View style={[s.micDot, { backgroundColor: theme.primary }]} />
          <View style={[s.micBar, { backgroundColor: theme.primary }]} />
          <View style={[s.micBase, { backgroundColor: theme.primary }]} />
        </View>
        <Text style={s.title}>Accès au micro</Text>
        <Text style={s.subtitle}>
          Pour que la magie opère, Diva a besoin d'entendre ta voix.
        </Text>
      </View>
      <View style={s.bottom}>
        <TouchableOpacity
          style={s.btn}
          onPress={async () => { await Audio.requestPermissionsAsync(); goNext(); }}
          activeOpacity={0.85}
        >
          <Text style={s.btnText}>Autoriser</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goNext} style={s.skipWrap}>
          <Text style={s.skip}>Plus tard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // --- Page 3: Perso ---
  const PersoPage = (
    <View key="perso" style={s.page}>
      <View style={s.form}>
        <Text style={s.title}>Fais-le tien</Text>

        <Text style={s.label}>PRÉNOM</Text>
        <TextInput
          style={s.input}
          placeholder="Ton prénom"
          placeholderTextColor={theme.textMuted}
          value={data.name}
          onChangeText={(t) => setData(d => ({ ...d, name: t }))}
          autoCapitalize="words"
          autoCorrect={false}
        />

        <Text style={s.label}>TUTOIEMENT</Text>
        <View style={s.chips}>
          {(['tu', 'vous'] as const).map(v => (
            <TouchableOpacity
              key={v}
              style={[s.chip, data.formality === v && s.chipOn]}
              onPress={() => setData(d => ({ ...d, formality: v }))}
            >
              <Text style={[s.chipText, data.formality === v && s.chipTextOn]}>
                {v === 'tu' ? 'Tu' : 'Vous'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>TON</Text>
        <View style={s.chips}>
          {[
            { v: 'friendly', l: 'Amical' },
            { v: 'professional', l: 'Pro' },
            { v: 'casual', l: 'Décontracté' },
          ].map(({ v, l }) => (
            <TouchableOpacity
              key={v}
              style={[s.chip, data.tone === v && s.chipOn]}
              onPress={() => setData(d => ({ ...d, tone: v as OnboardingData['tone'] }))}
            >
              <Text style={[s.chipText, data.tone === v && s.chipTextOn]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={s.bottom}>
        <TouchableOpacity style={s.btn} onPress={goNext} activeOpacity={0.85}>
          <Text style={s.btnText}>Continuer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // --- Page 4: Ready ---
  const ReadyPage = (
    <View key="ready" style={s.page}>
      <View style={s.hero}>
        <Image
          source={require('../../../assets/images/diva-logo.png')}
          style={s.logo}
          resizeMode="contain"
        />
        <Text style={s.title}>Tout est prêt{data.name ? `, ${data.name}` : ''}</Text>
        <Text style={s.subtitle}>
          Appuie sur l'orbe et parle.{'\n'}Diva fait le reste.
        </Text>
      </View>
      <View style={s.bottom}>
        <View style={s.features}>
          {['Météo, musique, recherche', 'Mémoire contextuelle', 'Réponse vocale naturelle'].map((f, i) => (
            <View key={i} style={s.featureRow}>
              <View style={[s.featureCheck, { backgroundColor: theme.tealSoft }]}>
                <Text style={[s.featureCheckText, { color: theme.teal }]}>✓</Text>
              </View>
              <Text style={s.featureText}>{f}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={[s.btn, { backgroundColor: theme.teal }]} onPress={finish} activeOpacity={0.85}>
          <Text style={s.btnText}>Commencer à parler</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const pages = [WelcomePage, MicroPage, PersoPage, ReadyPage];

  return (
    <View style={[{ flex: 1, backgroundColor: theme.bg }, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <FlatList
        ref={flatListRef}
        data={pages}
        renderItem={({ item }) => item}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyExtractor={(_, i) => String(i)}
      />
      <View style={s.dots}>
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={[
            s.dot,
            { backgroundColor: currentPage === i ? theme.primary : theme.divider },
            currentPage === i && s.dotOn,
          ]} />
        ))}
      </View>
    </View>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    page: { width, flex: 1, justifyContent: 'space-between', paddingHorizontal: 28 },
    hero: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    form: { flex: 1, justifyContent: 'center', paddingTop: 20 },
    bottom: { paddingBottom: 72 },

    // Orb
    logo: { width: 160, height: 160, marginBottom: 28 },
    orbWrap: { width: 130, height: 130, justifyContent: 'center', alignItems: 'center', marginBottom: 36 },
    orbGlow: { position: 'absolute', width: 130, height: 130, borderRadius: 65, opacity: 0.12 },
    orbCore: { width: 56, height: 56, borderRadius: 28 },
    orbRing: { position: 'absolute', width: 90, height: 90, borderRadius: 45, borderWidth: 1.5, opacity: 0.25 },

    // Mic icon (pure shapes, no emoji)
    iconBadge: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 28 },
    micDot: { width: 20, height: 28, borderRadius: 10, marginBottom: 2 },
    micBar: { width: 2, height: 8 },
    micBase: { width: 14, height: 2, borderRadius: 1, marginTop: 1 },

    // Typography
    brand: { fontSize: 44, fontWeight: '200', color: t.text, letterSpacing: 10, marginBottom: 12 },
    tagline: { fontSize: 19, fontWeight: '300', color: t.textSecondary, textAlign: 'center', lineHeight: 27 },
    title: { fontSize: 26, fontWeight: '600', color: t.text, textAlign: 'center', marginBottom: 10 },
    subtitle: { fontSize: 16, color: t.textSecondary, textAlign: 'center', lineHeight: 24, maxWidth: 280 },
    desc: { fontSize: 15, color: t.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 24 },

    // Button
    btn: { backgroundColor: t.primary, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
    btnText: { color: '#FFF', fontSize: 17, fontWeight: '600' },
    skipWrap: { paddingVertical: 14, alignItems: 'center' },
    skip: { color: t.textMuted, fontSize: 15 },

    // Form
    label: { fontSize: 12, fontWeight: '600', color: t.textMuted, letterSpacing: 1.5, marginBottom: 8, marginTop: 22 },
    input: { backgroundColor: t.inputBg, borderWidth: 1, borderColor: t.inputBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 17, color: t.text },
    chips: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    chip: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, backgroundColor: t.inputBg, borderWidth: 1, borderColor: t.inputBorder },
    chipOn: { backgroundColor: t.primarySoft, borderColor: t.primary },
    chipText: { fontSize: 15, color: t.textSecondary, fontWeight: '500' },
    chipTextOn: { color: t.primaryLight },

    // Features
    features: { marginBottom: 28 },
    featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    featureCheck: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    featureCheckText: { fontSize: 14, fontWeight: '700' },
    featureText: { fontSize: 15, color: t.textSecondary },

    // Dots
    dots: { flexDirection: 'row', justifyContent: 'center', paddingBottom: 16, gap: 6 },
    dot: { width: 6, height: 6, borderRadius: 3 },
    dotOn: { width: 20 },
  });
}
