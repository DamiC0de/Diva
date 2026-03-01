import React from 'react';
import { View, StyleSheet, TextInput, Alert, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { Text, Button } from '../../components/ui';
import { useTheme } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [mode, setMode] = React.useState<'login' | 'signup'>('login');

  const handleAuth = async () => {
    if (!email.includes('@') || password.length < 6) {
      Alert.alert('Erreur', 'Email invalide ou mot de passe trop court (6 caractères min)');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) throw loginError;
        router.replace('/(onboarding)');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      Alert.alert('Erreur', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={{ flex: 1 }} />

      <View style={styles.center}>
        <Image
          source={require('../../assets/images/diva-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text variant="hero" style={[styles.title, { color: theme.text }]}>diva</Text>
        <Text variant="body" color={theme.textSecondary} style={styles.subtitle}>
          Ton assistant vocal intelligent
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
          placeholder="ton@email.com"
          placeholderTextColor={theme.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
          placeholder="Mot de passe"
          placeholderTextColor={theme.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Button
          title={loading ? '...' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
          onPress={handleAuth}
          disabled={!email.includes('@') || password.length < 6 || loading}
        />
      </View>

      <TouchableOpacity onPress={() => setMode(m => m === 'login' ? 'signup' : 'login')} style={styles.switchMode}>
        <Text variant="body" color={theme.primary}>
          {mode === 'login' ? "Pas de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
        </Text>
      </TouchableOpacity>

      <View style={{ flex: 0.5 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 28 },
  center: { alignItems: 'center', marginBottom: 40 },
  logo: { width: 80, height: 80, marginBottom: 16 },
  title: { fontSize: 36, fontWeight: '200', letterSpacing: 8, marginBottom: 8 },
  subtitle: { textAlign: 'center' },
  form: { gap: 12, marginBottom: 20 },
  input: { borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1 },
  switchMode: { alignItems: 'center', paddingVertical: 12 },
});
