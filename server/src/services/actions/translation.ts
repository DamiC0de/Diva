/**
 * EL-024 — Mode Traduction Clavier
 */

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'Anglais', flag: '🇬🇧' },
  { code: 'es', name: 'Espagnol', flag: '🇪🇸' },
  { code: 'de', name: 'Allemand', flag: '🇩🇪' },
  { code: 'it', name: 'Italien', flag: '🇮🇹' },
  { code: 'pt', name: 'Portugais', flag: '🇵🇹' },
  { code: 'ar', name: 'Arabe', flag: '🇸🇦' },
  { code: 'zh', name: 'Chinois', flag: '🇨🇳' },
  { code: 'ja', name: 'Japonais', flag: '🇯🇵' },
] as const;

export function getTranslationPrompt(text: string, targetLang: string): string {
  return `Traduis ce texte en ${targetLang}. Détecte automatiquement la langue source. Retourne UNIQUEMENT la traduction, sans explication :\n\n${text}`;
}

export const translationTool = {
  name: 'translate_text',
  description: "Traduire un texte dans une autre langue. Utilisé par le clavier Elio.",
  input_schema: {
    type: 'object' as const,
    properties: {
      text: { type: 'string', description: 'Texte à traduire' },
      target_language: { type: 'string', description: 'Langue cible (en, es, de, it, pt, ar, zh, ja, ou nom complet)' },
    },
    required: ['text', 'target_language'],
  },
};
