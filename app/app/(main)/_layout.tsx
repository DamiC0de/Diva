import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../constants/colors';

export default function MainLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.bg },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="settings"
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'Réglages',
          headerStyle: { backgroundColor: theme.bg },
          headerTintColor: theme.text,
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
