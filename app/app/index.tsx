import { Redirect, useLocalSearchParams } from 'expo-router';

export default function Index() {
  // Preserve widget=true query param through the redirect
  const { widget } = useLocalSearchParams<{ widget?: string }>();
  return <Redirect href={widget === 'true' ? '/(main)?widget=true' : '/(main)'} />;
}
