import { Stack } from 'expo-router';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function OnboardingLayout() {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/(auth)/login');
      } else {
        setChecked(true);
      }
    });
  }, []);

  if (!checked) return null;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
  );
}
