/**
 * EL-014 — Settings hook
 *
 * Local-first: saves instantly to AsyncStorage.
 * Syncs to server in background (best-effort).
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, API_BASE_URL } from '../lib/api';
import { supabase } from '../lib/supabase';

export interface UserSettings {
  personality: {
    tone: 'friendly' | 'professional' | 'casual';
    verbosity: 'concise' | 'normal' | 'detailed';
    formality: 'tu' | 'vous';
    humor: boolean;
  };
  voice: {
    wake_word_mode: 'always_on' | 'smart' | 'manual';
    conversationMode: boolean;
    interruptOnKeyword: boolean;
  };
  onboarding_completed: boolean;
  tutorial_completed: boolean;
  timezone: string;
}

const STORAGE_KEY = '@diva_settings';

const DEFAULT_SETTINGS: UserSettings = {
  personality: { tone: 'friendly', verbosity: 'normal', formality: 'tu', humor: true },
  voice: { wake_word_mode: 'manual', conversationMode: false, interruptOnKeyword: true },
  onboarding_completed: false,
  tutorial_completed: false,
  timezone: 'Europe/Paris',
};

function deepMerge(defaults: UserSettings, partial: Partial<UserSettings>): UserSettings {
  return {
    ...defaults,
    ...partial,
    personality: { ...defaults.personality, ...(partial.personality || {}) },
    voice: { ...defaults.voice, ...(partial.voice || {}) },
  };
}

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Load from AsyncStorage first (instant), then optionally sync from server
  useEffect(() => {
    const load = async () => {
      try {
        // 1. Load from local cache (instant)
        const cached = await AsyncStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          setSettings(deepMerge(DEFAULT_SETTINGS, parsed));
          setLoading(false);
        }

        // 2. Try to sync from server (background, best-effort)
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) {
          setLoading(false);
          return;
        }

        try {
          const res = await api.get<{ settings?: Partial<UserSettings> }>('/api/v1/settings');
          if (res.data?.settings) {
            const merged = deepMerge(DEFAULT_SETTINGS, res.data.settings);
            setSettings(merged);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          }
        } catch {
          // Server unreachable — use cached version, that's fine
        }
      } catch {
        // Nothing cached either — use defaults
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Save to AsyncStorage immediately + debounce server sync
  const saveSettings = useCallback(async (updated: UserSettings) => {
    // Always save locally first (instant, reliable)
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Debounce server sync (300ms)
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) return;

        // Try HTTP first (works with NSAllowsArbitraryLoads = true in v24+)
        try {
          await api.patch('/api/v1/settings', { settings: updated });
          return;
        } catch {
          // HTTP failed — try WebSocket
        }

        // WebSocket fallback
        const wsUrl = API_BASE_URL.replace('http', 'ws');
        const ws = new WebSocket(`${wsUrl}/ws?token=${token}`);
        ws.onopen = () => {
          ws.send(JSON.stringify({ type: 'update_settings', settings: updated }));
          setTimeout(() => ws.close(), 2000);
        };
        ws.onerror = () => ws.close();
      } catch {
        // Background sync failed — local is already saved, user won't notice
      }
    }, 300);
  }, []);

  const updateSetting = useCallback(<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      saveSettings(updated);
      return updated;
    });
  }, [saveSettings]);

  const updatePersonality = useCallback(<K extends keyof UserSettings['personality']>(
    key: K,
    value: UserSettings['personality'][K],
  ) => {
    setSettings(prev => {
      const updated = { ...prev, personality: { ...prev.personality, [key]: value } };
      saveSettings(updated);
      return updated;
    });
  }, [saveSettings]);

  return { settings, loading, updateSetting, updatePersonality };
}
