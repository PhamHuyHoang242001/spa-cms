// locale-content.ts — Helper to extract localized text from bilingual DB fields
import type { LocalizedString } from './api-types';

export function localizedText(
  field: LocalizedString | string | null | undefined,
  locale: string,
): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return (field as unknown as Record<string, string>)[locale] || field.vi || '';
}
