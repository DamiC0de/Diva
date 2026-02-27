/**
 * EL-029 — Onboarding Screens (4 steps)
 */

import React, { useState, useRef } from 'react';
import {
  View, StyleSheet, FlatList, Dimensions, TextInput, Switch,
} from 'react-native';
import { router } from 'expo-router';
import { Screen, Text, Button } from '../../components/ui';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  content: React.ReactNode;
}

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState('');
  const [useTu, setUseTu] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  const goNext = () => {
    if (currentStep < steps.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
    } else {
      // Finish onboarding
      // TODO: save settings + set onboarding_completed = true
      router.replace('/(main)');
    }
  };

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: '',
      content: (
        <View style={styles.stepContent}>
          <Text variant="hero" color={Colors.primary} style={styles.centerText}>
            🌅
          </Text>
          <Text variant="hero" style={styles.centerText}>Elio</Text>
          <Text variant="body" color={Colors.textLight} style={styles.centerText}>
            Ton assistant vocal intelligent.{'\n'}
            Il gère tes emails, ton agenda, et bien plus — par la voix.
          </Text>
        </View>
      ),
    },
    {
      id: 'permissions',
      title: 'Autorisations',
      content: (
        <View style={styles.stepContent}>
          <Text variant="heading" style={styles.centerText}>
            Pour fonctionner, Elio a besoin de :
          </Text>
          <View style={styles.permissionList}>
            <PermissionItem
              icon="🎙️"
              title="Microphone"
              desc="Pour écouter tes demandes vocales"
              onPress={() => console.log('request mic')}
            />
            <PermissionItem
              icon="🔔"
              title="Notifications"
              desc="Pour tes rappels et alertes"
              onPress={() => console.log('request notifs')}
            />
          </View>
        </View>
      ),
    },
    {
      id: 'personalize',
      title: 'Personnalisation',
      content: (
        <View style={styles.stepContent}>
          <Text variant="heading" style={styles.centerText}>
            Comment t'appeler ?
          </Text>
          <TextInput
            style={styles.nameInput}
            placeholder="Ton prénom"
            placeholderTextColor={Colors.textLight}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <View style={styles.toggleRow}>
            <Text variant="body">Elio te tutoie ?</Text>
            <Switch
              value={useTu}
              onValueChange={setUseTu}
              trackColor={{ true: Colors.primary, false: Colors.border }}
            />
          </View>
        </View>
      ),
    },
    {
      id: 'services',
      title: 'Services',
      content: (
        <View style={styles.stepContent}>
          <Text variant="heading" style={styles.centerText}>
            Connecte tes services
          </Text>
          <Text variant="body" color={Colors.textLight} style={styles.centerText}>
            Tu pourras les ajouter plus tard dans les réglages.
          </Text>
          <View style={styles.servicesList}>
            <ServiceItem icon="📧" name="Gmail" />
            <ServiceItem icon="📅" name="Google Calendar" />
            <ServiceItem icon="🎵" name="Spotify" />
          </View>
        </View>
      ),
    },
  ];

  return (
    <Screen padded={false}>
      <FlatList
        ref={flatListRef}
        data={steps}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.slide}>{item.content}</View>
        )}
      />

      {/* Pagination dots */}
      <View style={styles.dotsRow}>
        {steps.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentStep && styles.dotActive]}
          />
        ))}
      </View>

      {/* Buttons */}
      <View style={styles.buttonRow}>
        {currentStep > 0 && currentStep < steps.length - 1 && (
          <Button title="Passer" onPress={goNext} variant="ghost" />
        )}
        <Button
          title={currentStep === steps.length - 1 ? 'C\'est parti ! 🚀' : 'Suivant'}
          onPress={goNext}
          style={styles.nextButton}
        />
      </View>
    </Screen>
  );
}

function PermissionItem({ icon, title, desc, onPress }: { icon: string; title: string; desc: string; onPress: () => void }) {
  return (
    <View style={styles.permItem}>
      <Text variant="heading">{icon}</Text>
      <View style={styles.permInfo}>
        <Text variant="subheading">{title}</Text>
        <Text variant="caption">{desc}</Text>
      </View>
      <Button title="Autoriser" onPress={onPress} variant="secondary" style={styles.permButton} />
    </View>
  );
}

function ServiceItem({ icon, name }: { icon: string; name: string }) {
  return (
    <View style={styles.serviceItem}>
      <Text variant="heading">{icon}</Text>
      <Text variant="body" style={styles.serviceName}>{name}</Text>
      <Button title="Connecter" onPress={() => {}} variant="secondary" style={styles.serviceButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  slide: { width, flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  stepContent: { gap: 16, alignItems: 'center' },
  centerText: { textAlign: 'center' },
  nameInput: {
    width: '100%', backgroundColor: Colors.white, borderRadius: 12,
    padding: 16, fontSize: 18, borderWidth: 1, borderColor: Colors.border,
    color: Colors.text, textAlign: 'center',
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 8 },
  permissionList: { width: '100%', gap: 16, marginTop: 16 },
  permItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.white, borderRadius: 12, padding: 16 },
  permInfo: { flex: 1 },
  permButton: { paddingVertical: 8, paddingHorizontal: 12 },
  servicesList: { width: '100%', gap: 12, marginTop: 16 },
  serviceItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.white, borderRadius: 12, padding: 16 },
  serviceName: { flex: 1 },
  serviceButton: { paddingVertical: 8, paddingHorizontal: 12 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.primary, width: 24 },
  buttonRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, paddingHorizontal: 32, paddingBottom: 32 },
  nextButton: { flex: 1 },
});
