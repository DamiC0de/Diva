/**
 * Glucose Integration
 * Query articles from glucose.press via Supabase
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let glucoseClient: SupabaseClient | null = null;

function getGlucoseClient(): SupabaseClient | null {
  if (glucoseClient) return glucoseClient;
  
  const url = process.env.GLUCOSE_SUPABASE_URL;
  const key = process.env.GLUCOSE_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    console.warn('[Glucose] Missing GLUCOSE_SUPABASE_URL or GLUCOSE_SUPABASE_ANON_KEY');
    return null;
  }
  
  glucoseClient = createClient(url, key);
  return glucoseClient;
}

export interface GlucoseArticle {
  id: string;
  title: string;
  title_fr?: string;
  category?: string;
  source_name?: string;
  published_at: string;
  url: string;
  summary_gemma?: string;
}

/**
 * Get latest articles from Glucose
 */
export async function getLatestArticles(limit = 10): Promise<GlucoseArticle[]> {
  const client = getGlucoseClient();
  if (!client) return [];
  
  const { data, error } = await client
    .from('articles')
    .select(`
      id,
      title,
      title_fr,
      category,
      published_at,
      url,
      summary_gemma,
      sources!inner(name)
    `)
    .is('archived_at', null)
    .order('published_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('[Glucose] Query error:', error.message);
    return [];
  }
  
  return (data || []).map((article: Record<string, unknown>) => ({
    id: String(article.id || ''),
    title: String(article.title || ''),
    title_fr: article.title_fr ? String(article.title_fr) : undefined,
    category: article.category ? String(article.category) : undefined,
    source_name: (article.sources as { name?: string })?.name,
    published_at: String(article.published_at || ''),
    url: String(article.url || ''),
    summary_gemma: article.summary_gemma ? String(article.summary_gemma) : undefined,
  }));
}

/**
 * Search articles by keyword
 */
export async function searchArticles(query: string, limit = 10): Promise<GlucoseArticle[]> {
  const client = getGlucoseClient();
  if (!client) return [];
  
  const { data, error } = await client
    .from('articles')
    .select(`
      id,
      title,
      title_fr,
      category,
      published_at,
      url,
      summary_gemma,
      sources!inner(name)
    `)
    .is('archived_at', null)
    .or(`title.ilike.%${query}%,title_fr.ilike.%${query}%,content.ilike.%${query}%`)
    .order('published_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('[Glucose] Search error:', error.message);
    return [];
  }
  
  return (data || []).map((article: Record<string, unknown>) => ({
    id: String(article.id || ''),
    title: String(article.title || ''),
    title_fr: article.title_fr ? String(article.title_fr) : undefined,
    category: article.category ? String(article.category) : undefined,
    source_name: (article.sources as { name?: string })?.name,
    published_at: String(article.published_at || ''),
    url: String(article.url || ''),
    summary_gemma: article.summary_gemma ? String(article.summary_gemma) : undefined,
  }));
}

/**
 * Get article count stats
 */
export async function getArticleStats(): Promise<{ total: number; today: number }> {
  const client = getGlucoseClient();
  if (!client) return { total: 0, today: 0 };
  
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const [totalResult, todayResult] = await Promise.all([
    client.from('articles').select('id', { count: 'exact', head: true }).is('archived_at', null),
    client.from('articles').select('id', { count: 'exact', head: true })
      .is('archived_at', null)
      .gte('published_at', todayStart.toISOString()),
  ]);
  
  return {
    total: totalResult.count || 0,
    today: todayResult.count || 0,
  };
}
