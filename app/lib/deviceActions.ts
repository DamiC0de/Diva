/**
 * EL-019 + EL-021 — Device-side action executor
 *
 * Handles actions that must run on the device (contacts, URL schemes).
 */

import * as Contacts from 'expo-contacts';
import * as Linking from 'expo-linking';

// URL Schemes for popular apps (EL-021)
const APP_SCHEMES: Record<string, { scheme: string; search?: string }> = {
  youtube: { scheme: 'youtube://', search: 'youtube://results?search_query={q}' },
  instagram: { scheme: 'instagram://' },
  spotify: { scheme: 'spotify://', search: 'spotify:search:{q}' },
  maps: { scheme: 'maps://', search: 'maps://?q={q}' },
  waze: { scheme: 'waze://', search: 'waze://?q={q}&navigate=yes' },
  whatsapp: { scheme: 'whatsapp://' },
  uber: { scheme: 'uber://' },
  netflix: { scheme: 'netflix://' },
  twitter: { scheme: 'twitter://' },
  tiktok: { scheme: 'snssdk1233://' },
  safari: { scheme: 'https://' },
};

interface ContactResult {
  name: string;
  phone?: string;
  email?: string;
}

interface DeviceActionResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Execute a device-side action requested by the server.
 */
export async function executeDeviceAction(
  action: string,
  params: Record<string, unknown>,
): Promise<DeviceActionResult> {
  switch (action) {
    case 'search_contacts':
      return searchContacts(params.query as string);

    case 'open_url':
      return openUrl(params.url as string);

    case 'open_app':
      return openApp(params.app as string, params.query as string | undefined);

    default:
      return { success: false, error: `Unknown action: ${action}` };
  }
}

async function searchContacts(query: string): Promise<DeviceActionResult> {
  try {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      return { success: false, error: 'Permission contacts refusée' };
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
      name: query,
      pageSize: 5,
    });

    const results: ContactResult[] = data.map((c) => ({
      name: `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim(),
      phone: c.phoneNumbers?.[0]?.number,
      email: c.emails?.[0]?.email,
    }));

    return { success: true, data: results };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

async function openUrl(url: string): Promise<DeviceActionResult> {
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      return { success: false, error: `Cannot open URL: ${url}` };
    }
    await Linking.openURL(url);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

async function openApp(appName: string, query?: string): Promise<DeviceActionResult> {
  const app = APP_SCHEMES[appName.toLowerCase()];
  if (!app) {
    return { success: false, error: `App inconnue: ${appName}` };
  }

  let url = app.scheme;
  if (query && app.search) {
    url = app.search.replace('{q}', encodeURIComponent(query));
  }

  return openUrl(url);
}
