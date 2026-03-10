/**
 * MemoryService — Persistent memory for Diva assistant.
 *
 * Two layers:
 * - Short-term: last 24h of detailed conversation pairs (AsyncStorage)
 * - Long-term: extracted key points — names, preferences, recurring topics (AsyncStorage)
 *
 * Key points are automatically extracted after each exchange using simple
 * heuristics (no LLM call — keeps it fast and offline-capable).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Storage keys ──────────────────────────────────────────────────────────────
const SHORT_TERM_KEY = 'diva_memory_short_term';
const LONG_TERM_KEY = 'diva_memory_long_term';

// ── Limits ────────────────────────────────────────────────────────────────────
const SHORT_TERM_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const SHORT_TERM_MAX = 40; // max conversation pairs
const LONG_TERM_MAX = 100; // max key points

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ConversationPair {
  id: string;
  userText: string;
  assistantText: string;
  timestamp: number;
}

export interface KeyPoint {
  id: string;
  category: 'name' | 'preference' | 'fact' | 'topic' | 'location' | 'relation';
  content: string;
  /** How many times this point has been reinforced */
  occurrences: number;
  createdAt: number;
  lastSeenAt: number;
}

export interface MemoryContext {
  recentConversations: ConversationPair[];
  keyPoints: KeyPoint[];
}

// ── Extraction patterns ───────────────────────────────────────────────────────
// These heuristics extract facts without needing an LLM call.

const EXTRACTION_RULES: Array<{
  pattern: RegExp;
  category: KeyPoint['category'];
  extract: (match: RegExpMatchArray, userText: string) => string | null;
}> = [
  // "Je m'appelle X" / "Mon nom c'est X" / "Appelle-moi X"
  {
    pattern: /(?:je m['']?appelle|mon (?:nom|prénom)(?: c['']?est)?|appelle[- ]?moi)\s+([A-ZÀ-Ü][a-zà-ü]+(?:\s+[A-ZÀ-Ü][a-zà-ü]+)?)/i,
    category: 'name',
    extract: (m) => `L'utilisateur s'appelle ${m[1]}`,
  },
  // "Mon ami/frère/sœur/femme/mari X"
  {
    pattern: /(?:mon|ma)\s+(ami|amie|frère|sœur|soeur|femme|mari|copain|copine|père|mère|fils|fille|collègue|boss|patron|chef)\s+(?:s['']?appelle\s+)?([A-ZÀ-Ü][a-zà-ü]+)/i,
    category: 'relation',
    extract: (m) => `${m[1].charAt(0).toUpperCase() + m[1].slice(1)} de l'utilisateur : ${m[2]}`,
  },
  // "J'habite à X" / "Je vis à X" / "Je suis à X"
  {
    pattern: /(?:j['']?habite|je vis|je suis|je réside)\s+(?:à|au|en|aux)\s+([A-ZÀ-Ü][a-zà-ü]+(?:[- ][A-ZÀ-Ü][a-zà-ü]+)*)/i,
    category: 'location',
    extract: (m) => `Habite à ${m[1]}`,
  },
  // "Je travaille chez X" / "Je suis développeur/médecin/..."
  {
    pattern: /je (?:travaille (?:chez|à|pour)|suis)\s+(développeur|dev|ingénieur|médecin|prof|professeur|étudiant|designer|manager|directeur|consultant|avocat|architecte|infirmier|infirmière|comptable|commercial|freelance|entrepreneur)e?\b/i,
    category: 'fact',
    extract: (m) => `Profession : ${m[1]}`,
  },
  {
    pattern: /je travaille (?:chez|à|pour|dans)\s+(.{2,40}?)(?:\.|,|$)/i,
    category: 'fact',
    extract: (m) => `Travaille chez ${m[1].trim()}`,
  },
  // "J'aime X" / "Je préfère X" / "Mon X préféré"
  {
    pattern: /(?:j['']?aime(?: (?:bien|beaucoup|vraiment))?|je (?:préfère|kiffe|adore))\s+(.{3,50}?)(?:\.|,|$)/i,
    category: 'preference',
    extract: (m) => `Aime ${m[1].trim()}`,
  },
  // "Je n'aime pas X" / "Je déteste X"
  {
    pattern: /(?:je (?:n['']?aime pas|déteste|supporte pas))\s+(.{3,50}?)(?:\.|,|$)/i,
    category: 'preference',
    extract: (m) => `N'aime pas ${m[1].trim()}`,
  },
  // "Mon anniversaire c'est le X"
  {
    pattern: /(?:mon anniversaire|je suis né)\s+(?:c['']?est\s+)?(?:le\s+)?(\d{1,2}\s+\w+|\d{1,2}\/\d{1,2})/i,
    category: 'fact',
    extract: (m) => `Anniversaire : ${m[1]}`,
  },
  // "Rappelle-toi que X" / "Souviens-toi que X" / "Retiens que X"
  {
    pattern: /(?:rappelle[- ]?toi|souviens[- ]?toi|retiens|n['']?oublie pas)\s+(?:que\s+)?(.{5,80}?)(?:\.|$)/i,
    category: 'fact',
    extract: (m) => m[1].trim(),
  },
];

// ── Service ───────────────────────────────────────────────────────────────────

/**
 * Load short-term conversations (last 24h).
 */
export async function getShortTermMemory(): Promise<ConversationPair[]> {
  try {
    const raw = await AsyncStorage.getItem(SHORT_TERM_KEY);
    if (!raw) return [];

    const entries: ConversationPair[] = JSON.parse(raw);
    const now = Date.now();
    return entries.filter((e) => now - e.timestamp < SHORT_TERM_TTL_MS);
  } catch (err) {
    console.error('[MemoryService] getShortTermMemory error:', err);
    return [];
  }
}

/**
 * Load long-term key points.
 */
export async function getLongTermMemory(): Promise<KeyPoint[]> {
  try {
    const raw = await AsyncStorage.getItem(LONG_TERM_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as KeyPoint[];
  } catch (err) {
    console.error('[MemoryService] getLongTermMemory error:', err);
    return [];
  }
}

/**
 * Save a conversation pair to short-term memory and auto-extract key points.
 */
export async function saveConversation(
  userText: string,
  assistantText: string,
): Promise<void> {
  try {
    const current = await getShortTermMemory();

    const pair: ConversationPair = {
      id: Math.random().toString(36).slice(2),
      userText,
      assistantText,
      timestamp: Date.now(),
    };

    const updated = [pair, ...current].slice(0, SHORT_TERM_MAX);
    await AsyncStorage.setItem(SHORT_TERM_KEY, JSON.stringify(updated));

    // Auto-extract key points from the user's message
    await extractKeyPoints(userText);
  } catch (err) {
    console.error('[MemoryService] saveConversation error:', err);
  }
}

/**
 * Run extraction rules against user text and persist new key points.
 */
async function extractKeyPoints(userText: string): Promise<void> {
  const newPoints: Array<{ category: KeyPoint['category']; content: string }> = [];

  for (const rule of EXTRACTION_RULES) {
    const match = userText.match(rule.pattern);
    if (match) {
      const content = rule.extract(match, userText);
      if (content) {
        newPoints.push({ category: rule.category, content });
      }
    }
  }

  if (newPoints.length === 0) return;

  const existing = await getLongTermMemory();
  const now = Date.now();

  for (const point of newPoints) {
    // Check for duplicate / reinforce existing
    const duplicate = existing.find(
      (e) =>
        e.category === point.category &&
        normalise(e.content) === normalise(point.content),
    );

    if (duplicate) {
      duplicate.occurrences += 1;
      duplicate.lastSeenAt = now;
    } else {
      existing.push({
        id: Math.random().toString(36).slice(2),
        category: point.category,
        content: point.content,
        occurrences: 1,
        createdAt: now,
        lastSeenAt: now,
      });
    }
  }

  // Cap at max & sort by relevance (occurrences × recency)
  const sorted = existing
    .sort((a, b) => {
      const scoreA = a.occurrences * (1 + (a.lastSeenAt - a.createdAt) / (30 * 24 * 60 * 60 * 1000));
      const scoreB = b.occurrences * (1 + (b.lastSeenAt - b.createdAt) / (30 * 24 * 60 * 60 * 1000));
      return scoreB - scoreA;
    })
    .slice(0, LONG_TERM_MAX);

  await AsyncStorage.setItem(LONG_TERM_KEY, JSON.stringify(sorted));
}

/**
 * Build the memory context to inject into the system prompt.
 */
export async function getMemoryContext(): Promise<MemoryContext> {
  const [recentConversations, keyPoints] = await Promise.all([
    getShortTermMemory(),
    getLongTermMemory(),
  ]);
  return { recentConversations, keyPoints };
}

/**
 * Format memory context for system prompt injection.
 * Returns a compact string suitable for sending to the server.
 */
export function formatMemoryForPrompt(ctx: MemoryContext): string {
  const parts: string[] = [];

  // Long-term key points
  if (ctx.keyPoints.length > 0) {
    const points = ctx.keyPoints
      .map((kp) => `- [${kp.category}] ${kp.content}`)
      .join('\n');
    parts.push(`## Mémoire long-terme\n${points}`);
  }

  // Short-term: summarise last few exchanges
  if (ctx.recentConversations.length > 0) {
    const recent = ctx.recentConversations.slice(0, 10); // last 10 exchanges
    const lines = recent
      .reverse()
      .map((c) => `User: ${c.userText}\nDiva: ${truncate(c.assistantText, 120)}`)
      .join('\n---\n');
    parts.push(`## Conversations récentes (dernières 24h)\n${lines}`);
  }

  return parts.join('\n\n');
}

/**
 * Clear all memory (for debugging / privacy).
 */
export async function clearAllMemory(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(SHORT_TERM_KEY),
    AsyncStorage.removeItem(LONG_TERM_KEY),
  ]);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalise(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, ' ');
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 3) + '...';
}
