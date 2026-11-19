export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'bloomweeks_theme_v1';

export function resolveInitialTheme(
  savedValue: string | null,
  prefersDark: boolean
): Theme {
  if (savedValue === 'dark' || savedValue === 'light') {
    return savedValue;
  }
  return prefersDark ? 'dark' : 'light';
}

export function toggleThemeValue(current: Theme): Theme {
  return current === 'dark' ? 'light' : 'dark';
}
