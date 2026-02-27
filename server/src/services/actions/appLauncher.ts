/**
 * EL-021 — App Launcher URL Schemes (server-side config)
 *
 * Maps app names to URL schemes for device-side execution.
 */

export const APP_CATALOG = {
  youtube: {
    name: 'YouTube',
    icon: '📺',
    scheme: 'youtube://',
    searchUrl: 'youtube://results?search_query={q}',
  },
  spotify: {
    name: 'Spotify',
    icon: '🎵',
    scheme: 'spotify://',
    searchUrl: 'spotify:search:{q}',
  },
  maps: {
    name: 'Plans',
    icon: '🗺️',
    scheme: 'maps://',
    searchUrl: 'maps://?daddr={q}',
  },
  waze: {
    name: 'Waze',
    icon: '🚗',
    scheme: 'waze://',
    searchUrl: 'waze://?q={q}&navigate=yes',
  },
  whatsapp: {
    name: 'WhatsApp',
    icon: '💬',
    scheme: 'whatsapp://',
  },
  instagram: {
    name: 'Instagram',
    icon: '📸',
    scheme: 'instagram://',
  },
  twitter: {
    name: 'X (Twitter)',
    icon: '🐦',
    scheme: 'twitter://',
  },
  netflix: {
    name: 'Netflix',
    icon: '🎬',
    scheme: 'netflix://',
  },
  uber: {
    name: 'Uber',
    icon: '🚕',
    scheme: 'uber://',
  },
  tiktok: {
    name: 'TikTok',
    icon: '🎵',
    scheme: 'snssdk1233://',
  },
} as const;
