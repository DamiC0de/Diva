/**
 * EL-014 — Settings hook with debounced save
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '../lib/api';

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

const DEFAULT_SETTINGS: UserSettings = {
  personality: { tone: 'friendly', verbosity: 'normal', formality: 'tu', humor: true },
  voice: { wake_word_mode: 'manual', conversationMode: false, interruptOnKeyword: true },
  onboarding_completed: false,
  tutorial_completed: false,
  timezone: 'Europe/Paris',
};

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latestSettingsRef = useRef<UserSettings>(DEFAULT_SETTINGS);

  // Keep ref in sync
  useEffect(() => {
    latestSettingsRef.current = settings;
  }, [settings]);

  const loadSettings = useCallback(async () => {
    try {
      const res = await api.get<{ settings?: Partial<UserSettings> }>('/api/v1/settings');
      if (res.data?.settings) {
        const merged = deepMergeSettings(DEFAULT_SETTINGS, res.data.settings);
        setSettings(merged);
        latestSettingsRef.current = merged;
      }
    } catch (err) {
      console.error('[Settings] Failed to load:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = useCallback(async (updated: UserSettings) => {
    try {
      await api.patch('/api/v1/settings', { settings: updated });
    } catch (error) {
      console.error('[Settings] Failed to save:', error);
      // Revert to server state on failure
      loadSettings();
    }
  }, [loadSettings]);

  const updateSetting = useCallback(<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      latestSettingsRef.current = updated;
      // Debounce save (500ms)
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => saveSettings(updated), 500);
      return updated;
    });
  }, [saveSettings]);

  const updatePersonality = useCallback(<K extends keyof UserSettings['personality']>(
    key: K,
    value: UserSettings['personality'][K],
  ) => {
    setSettings(prev => {
      const updated = { ...prev, personality: { ...prev.personality, [key]: value } };
      latestSettingsRef.current = updated;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => saveSettings(updated), 500);
      return updated;
    });
  }, [saveSettings]);

  return { settings, loading, updateSetting, updatePersonality, reload: loadSettings };
}

/** Deep merge settings with defaults to ensure all keys exist */
function deepMergeSettings(defaults: UserSettings, partial: Partial<UserSettings>): UserSettings {
  return {
    personality: {
      ...defaults.personality,
      ...(partial.personality || {}),
    },
    voice: {
      ...defaults.voice,
      ...(partial.voice || {}),
    },
    onboarding_completed: partial.onboarding_completed ?? defaults.onboarding_completed,
    tutorial_completed: partial.tutorial_completed ?? defaults.tutorial_completed,
    timezone: partial.timezone ?? defaults.timezone,
  };
}
