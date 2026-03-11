/**
 * EL-014 — Settings hook
 *
 * Uses WebSocket for settings sync (bypasses iOS ATS HTTP restrictions).
 * Falls back to HTTP API if WebSocket is not available.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
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
  const wsRef = useRef<WebSocket | null>(null);
  const pendingSaveRef = useRef<UserSettings | null>(null);

  // Setup WebSocket for settings
  const setupSettingsWs = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;

    const wsUrl = API_BASE_URL.replace('http', 'ws');
    const ws = new WebSocket(`${wsUrl}/ws?token=${token}`);

    ws.onopen = () => {
      console.log('[Settings] WS connected, requesting settings');
      ws.send(JSON.stringify({ type: 'get_settings' }));

      // Send any pending save
      if (pendingSaveRef.current) {
        ws.send(JSON.stringify({ type: 'update_settings', settings: pendingSaveRef.current }));
        pendingSaveRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'settings' || msg.type === 'settings_saved') {
          const merged = deepMergeSettings(DEFAULT_SETTINGS, msg.settings || {});
          setSettings(merged);
          setLoading(false);
          console.log('[Settings] Received from server:', msg.type);
        }
        if (msg.type === 'settings_error') {
          console.error('[Settings] Server error:', msg.error);
        }
      } catch {
        // Not a settings message — ignore
      }
    };

    ws.onerror = () => {
      console.warn('[Settings] WS error, falling back to HTTP');
      loadSettingsHTTP();
    };

    ws.onclose = () => {
      wsRef.current = null;
    };

    wsRef.current = ws;

    // Auto-close after 30s (don't keep WS open just for settings)
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    }, 30000);
  }, []);

  // HTTP fallback
  const loadSettingsHTTP = useCallback(async () => {
    try {
      const res = await api.get<{ settings?: Partial<UserSettings> }>('/api/v1/settings');
      if (res.data?.settings) {
        setSettings(deepMergeSettings(DEFAULT_SETTINGS, res.data.settings));
      }
    } catch (err) {
      console.error('[Settings] HTTP load failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load settings on mount via WebSocket
  useEffect(() => {
    setupSettingsWs();
    return () => {
      wsRef.current?.close();
    };
  }, [setupSettingsWs]);

  const saveSettings = useCallback(async (updated: UserSettings) => {
    // Try WebSocket first
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'update_settings', settings: updated }));
      console.log('[Settings] Saved via WS');
      return;
    }

    // Open a new WS connection to save
    pendingSaveRef.current = updated;
    setupSettingsWs();

    // Also try HTTP as fallback
    try {
      await api.patch('/api/v1/settings', { settings: updated });
      console.log('[Settings] Saved via HTTP fallback');
    } catch (err) {
      console.warn('[Settings] HTTP save failed (expected if ATS blocks):', err);
    }
  }, [setupSettingsWs]);

  const updateSetting = useCallback(<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => saveSettings(updated), 300);
      return updated;
    });
  }, [saveSettings]);

  const updatePersonality = useCallback(<K extends keyof UserSettings['personality']>(
    key: K,
    value: UserSettings['personality'][K],
  ) => {
    setSettings(prev => {
      const updated = { ...prev, personality: { ...prev.personality, [key]: value } };
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => saveSettings(updated), 300);
      return updated;
    });
  }, [saveSettings]);

  return { settings, loading, updateSetting, updatePersonality, reload: setupSettingsWs };
}

function deepMergeSettings(defaults: UserSettings, partial: Partial<UserSettings>): UserSettings {
  return {
    personality: { ...defaults.personality, ...(partial.personality || {}) },
    voice: { ...defaults.voice, ...(partial.voice || {}) },
    onboarding_completed: partial.onboarding_completed ?? defaults.onboarding_completed,
    tutorial_completed: partial.tutorial_completed ?? defaults.tutorial_completed,
    timezone: partial.timezone ?? defaults.timezone,
  };
}
