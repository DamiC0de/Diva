import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../../constants/colors';

export default function MainLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="settings"
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'Réglages',
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
