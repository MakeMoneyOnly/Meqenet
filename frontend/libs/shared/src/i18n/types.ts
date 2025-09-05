export type SupportedLanguageCode = 'en' | 'am';

export type LanguageDirection = 'ltr' | 'rtl';

export interface LanguageConfig {
  code: string;
  name: string;
  dir: LanguageDirection;
}
