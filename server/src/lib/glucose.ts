/**
 * Glucose Integration
 * Query articles and analyses from glucose.press via Supabase
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

export interface GlucoseComparison {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  sources_count: number;
  countries_count: number;
  quality_score?: number;
  created_at: string;
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
    .in('language', ['fr', 'en'])
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
    .in('language', ['fr', 'en'])
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
 * Get latest comparative analyses / dossiers from Glucose
 */
export async function getLatestComparisons(limit = 5): Promise<GlucoseComparison[]> {
  const client = getGlucoseClient();
  if (!client) return [];
  
  const { data, error } = await client
    .from('synthesized_comparisons')
    .select(`
      id,
      title,
      summary,
      content,
      sources_count,
      countries_count,
      quality_score,
      created_at
    `)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('[Glucose] Comparisons query error:', error.message);
    return [];
  }
  
  return (data || []).map((comp: Record<string, unknown>) => ({
    id: String(comp.id || ''),
    title: String(comp.title || ''),
    summary: comp.summary ? String(comp.summary) : undefined,
    content: comp.content ? String(comp.content) : undefined,
    sources_count: Number(comp.sources_count || 0),
    countries_count: Number(comp.countries_count || 0),
    quality_score: comp.quality_score ? Number(comp.quality_score) : undefined,
    created_at: String(comp.created_at || ''),
  }));
}

/**
 * Search comparative analyses by keyword
 */
export async function searchComparisons(query: string, limit = 5): Promise<GlucoseComparison[]> {
  const client = getGlucoseClient();
  if (!client) return [];
  
  const { data, error } = await client
    .from('synthesized_comparisons')
    .select(`
      id,
      title,
      summary,
      content,
      sources_count,
      countries_count,
      quality_score,
      created_at
    `)
    .or(`title.ilike.%${query}%,summary.ilike.%${query}%,content.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('[Glucose] Comparisons search error:', error.message);
    return [];
  }
  
  return (data || []).map((comp: Record<string, unknown>) => ({
    id: String(comp.id || ''),
    title: String(comp.title || ''),
    summary: comp.summary ? String(comp.summary) : undefined,
    content: comp.content ? String(comp.content) : undefined,
    sources_count: Number(comp.sources_count || 0),
    countries_count: Number(comp.countries_count || 0),
    quality_score: comp.quality_score ? Number(comp.quality_score) : undefined,
    created_at: String(comp.created_at || ''),
  }));
}

/**
 * Get a specific comparison by ID with full content
 */
export async function getComparisonById(id: string): Promise<GlucoseComparison | null> {
  const client = getGlucoseClient();
  if (!client) return null;
  
  const { data, error } = await client
    .from('synthesized_comparisons')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error || !data) {
    console.error('[Glucose] Get comparison error:', error?.message);
    return null;
  }
  
  return {
    id: String(data.id || ''),
    title: String(data.title || ''),
    summary: data.summary ? String(data.summary) : undefined,
    content: data.content ? String(data.content) : undefined,
    sources_count: Number(data.sources_count || 0),
    countries_count: Number(data.countries_count || 0),
    quality_score: data.quality_score ? Number(data.quality_score) : undefined,
    created_at: String(data.created_at || ''),
  };
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
