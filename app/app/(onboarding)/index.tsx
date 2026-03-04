/**
 * DIVA Onboarding — 2026 Design
 * Luminous Intelligence palette, modern transitions
 */
import React, { useRef, useState } from 'react';
import {
  Image,
  View, FlatList, Dimensions, TextInput, TouchableOpacity,
  StyleSheet, Text, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Audio } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useTheme, type Theme } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

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
      {/* Hero section with mascot */}
      <View style={s.heroSection}>
        <View style={s.mascotContainer}>
          <Image
            source={require('../../assets/images/diva-logo.png')}
            style={s.mascot}
            resizeMode="contain"
          />
        </View>
        <Text style={s.brandName}>diva</Text>
        <Text style={s.tagline}>Ton compagnon IA{'\n'}toujours à l'écoute</Text>
      </View>

      {/* Bottom section */}
      <View style={s.bottomSection}>
        <Text style={s.description}>
          Parle naturellement. Diva comprend, mémorise et s'adapte à toi au fil du temps.
        </Text>
        <TouchableOpacity style={s.primaryBtn} onPress={goNext} activeOpacity={0.85}>
          <LinearGradient
            colors={[theme.cyan, theme.indigo]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.btnGradient}
          >
            <Text style={s.primaryBtnText}>Commencer</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  // --- Page 2: Microphone ---
  const MicroPage = (
    <View key="micro" style={s.page}>
      <View style={s.centerSection}>
        {/* Mic icon */}
        <View style={[s.iconCircle, { backgroundColor: theme.primarySoft }]}>
          <Text style={s.iconEmoji}>🎙️</Text>
        </View>
        <Text style={s.pageTitle}>Accès au micro</Text>
        <Text style={s.pageSubtitle}>
          Pour que Diva puisse t'entendre, autorise l'accès au microphone.
        </Text>
      </View>
      <View style={s.bottomSection}>
        <TouchableOpacity
          style={s.primaryBtn}
          onPress={async () => { await Audio.requestPermissionsAsync(); goNext(); }}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[theme.cyan, theme.indigo]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.btnGradient}
          >
            <Text style={s.primaryBtnText}>Autoriser</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={goNext} style={s.skipBtn}>
          <Text style={s.skipText}>Plus tard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // --- Page 3: Personalization ---
  const PersoPage = (
    <View key="perso" style={s.page}>
      <View style={s.formSection}>
        <Text style={s.pageTitle}>Personnalise Diva</Text>

        <Text style={s.inputLabel}>TON PRÉNOM</Text>
        <TextInput
          style={[s.input, { borderColor: theme.inputBorder, color: theme.text }]}
          placeholder="Comment tu t'appelles ?"
          placeholderTextColor={theme.textMuted}
          value={data.name}
          onChangeText={(t) => setData(d => ({ ...d, name: t }))}
          autoCapitalize="words"
          autoCorrect={false}
        />

        <Text style={s.inputLabel}>TUTOIEMENT</Text>
        <View style={s.chipRow}>
          {(['tu', 'vous'] as const).map(v => (
            <TouchableOpacity
              key={v}
              style={[s.chip, data.formality === v && { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}
              onPress={() => setData(d => ({ ...d, formality: v }))}
            >
              <Text style={[s.chipText, data.formality === v && { color: theme.primary }]}>
                {v === 'tu' ? 'Tutoie-moi' : 'Vouvoyez-moi'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.inputLabel}>TON DE VOIX</Text>
        <View style={s.chipRow}>
          {[
            { v: 'friendly', l: '😊 Amical', e: '' },
            { v: 'professional', l: '💼 Pro', e: '' },
            { v: 'casual', l: '😎 Décontracté', e: '' },
          ].map(({ v, l }) => (
            <TouchableOpacity
              key={v}
              style={[s.chip, data.tone === v && { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}
              onPress={() => setData(d => ({ ...d, tone: v as OnboardingData['tone'] }))}
            >
              <Text style={[s.chipText, data.tone === v && { color: theme.primary }]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={s.bottomSection}>
        <TouchableOpacity style={s.primaryBtn} onPress={goNext} activeOpacity={0.85}>
          <LinearGradient
            colors={[theme.cyan, theme.indigo]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.btnGradient}
          >
            <Text style={s.primaryBtnText}>Continuer</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  // --- Page 4: Ready ---
  const ReadyPage = (
    <View key="ready" style={s.page}>
      <View style={s.centerSection}>
        <Image
          source={require('../../assets/images/diva-logo.png')}
          style={s.mascotSmall}
          resizeMode="contain"
        />
        <Text style={s.pageTitle}>
          {data.name ? `Enchanté${data.formality === 'vous' ? '' : 'e'}, ${data.name} !` : 'Tout est prêt !'}
        </Text>
        <Text style={s.pageSubtitle}>
          Appuie sur l'orbe et parle.{'\n'}Diva s'occupe du reste.
        </Text>

        {/* Features */}
        <View style={s.featureList}>
          {[
            { icon: '🎤', text: 'Comprend ta voix naturellement' },
            { icon: '🧠', text: 'Se souvient de tes préférences' },
            { icon: '💬', text: 'Répond comme un ami' },
          ].map((f, i) => (
            <View key={i} style={s.featureRow}>
              <View style={[s.featureIcon, { backgroundColor: theme.cyanSoft }]}>
                <Text style={s.featureIconText}>{f.icon}</Text>
              </View>
              <Text style={[s.featureText, { color: theme.textSecondary }]}>{f.text}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={s.bottomSection}>
        <TouchableOpacity style={s.primaryBtn} onPress={finish} activeOpacity={0.85}>
          <LinearGradient
            colors={[theme.indigo, theme.violet]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.btnGradient}
          >
            <Text style={s.primaryBtnText}>Rencontrer Diva</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const pages = [WelcomePage, MicroPage, PersoPage, ReadyPage];

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={[theme.bgGradientStart, theme.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
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
        {/* Dots indicator */}
        <View style={s.dotsRow}>
          {[0, 1, 2, 3].map(i => (
            <View
              key={i}
              style={[
                s.dot,
                { backgroundColor: currentPage === i ? theme.primary : theme.divider },
                currentPage === i && s.dotActive,
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    page: {
      width,
      flex: 1,
      paddingHorizontal: 28,
    },
    
    // Hero (welcome page)
    heroSection: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 40,
    },
    mascotContainer: {
      marginBottom: 20,
    },
    mascot: {
      width: 160,
      height: 160,
    },
    brandName: {
      fontSize: 48,
      fontWeight: '200',
      color: t.text,
      letterSpacing: 12,
      marginBottom: 12,
    },
    tagline: {
      fontSize: 20,
      fontWeight: '300',
      color: t.textSecondary,
      textAlign: 'center',
      lineHeight: 28,
    },

    // Center section (other pages)
    centerSection: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 40,
    },
    iconCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 28,
    },
    iconEmoji: {
      fontSize: 44,
    },
    pageTitle: {
      fontSize: 28,
      fontWeight: '600',
      color: t.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    pageSubtitle: {
      fontSize: 17,
      color: t.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      maxWidth: 300,
    },

    // Bottom section
    bottomSection: {
      paddingBottom: 48,
    },
    description: {
      fontSize: 16,
      color: t.textMuted,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 28,
    },

    // Buttons
    primaryBtn: {
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: t.indigo,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    btnGradient: {
      paddingVertical: 18,
      alignItems: 'center',
    },
    primaryBtnText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '600',
    },
    skipBtn: {
      paddingVertical: 16,
      alignItems: 'center',
    },
    skipText: {
      color: t.textMuted,
      fontSize: 16,
    },

    // Form
    formSection: {
      flex: 1,
      justifyContent: 'center',
      paddingTop: 20,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: t.textMuted,
      letterSpacing: 1.5,
      marginBottom: 10,
      marginTop: 24,
    },
    input: {
      backgroundColor: t.inputBg,
      borderWidth: 1.5,
      borderRadius: 14,
      paddingHorizontal: 18,
      paddingVertical: 16,
      fontSize: 17,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    chip: {
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: 12,
      backgroundColor: t.inputBg,
      borderWidth: 1.5,
      borderColor: t.inputBorder,
    },
    chipText: {
      fontSize: 15,
      color: t.textSecondary,
      fontWeight: '500',
    },

    // Features
    featureList: {
      marginTop: 36,
      gap: 16,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    featureIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    featureIconText: {
      fontSize: 20,
    },
    featureText: {
      fontSize: 16,
      fontWeight: '500',
    },

    // Small mascot
    mascotSmall: {
      width: 100,
      height: 100,
      marginBottom: 20,
    },

    // Dots
    dotsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      paddingBottom: 16,
      gap: 8,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    dotActive: {
      width: 24,
    },
  });
}
