/**
 * EL-023 — Mode Rédaction Assistée
 * Text manipulation prompts for the keyboard extension
 */

export type RedactionAction = 'reformulate' | 'correct' | 'shorten' | 'formalize' | 'complete';

const PROMPTS: Record<RedactionAction, string> = {
  reformulate: "Reformule ce texte de manière plus claire et naturelle en français. Retourne UNIQUEMENT le texte reformulé, sans explication :\n\n",
  correct: "Corrige l'orthographe et la grammaire de ce texte en français. Retourne UNIQUEMENT le texte corrigé, sans explication :\n\n",
  shorten: "Raccourcis ce texte tout en gardant le sens. Retourne UNIQUEMENT la version courte, sans explication :\n\n",
  formalize: "Réécris ce texte dans un registre plus formel et professionnel en français. Retourne UNIQUEMENT le texte formel, sans explication :\n\n",
  complete: "Continue ce texte de manière naturelle (1-2 phrases max). Retourne UNIQUEMENT la suite du texte, sans explication :\n\n",
};

export function getRedactionPrompt(action: RedactionAction, text: string): string {
  return PROMPTS[action] + text;
}

// Tool for Claude (used via keyboard extension API)
export const redactionTool = {
  name: 'redact_text',
  description: "Reformuler, corriger, raccourcir, formaliser ou compléter un texte. Utilisé par le clavier Elio.",
  input_schema: {
    type: 'object' as const,
    properties: {
      action: {
        type: 'string',
        enum: ['reformulate', 'correct', 'shorten', 'formalize', 'complete'],
        description: "Action de rédaction",
      },
      text: { type: 'string', description: 'Texte à traiter' },
    },
    required: ['action', 'text'],
  },
};
