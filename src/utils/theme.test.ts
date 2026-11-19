import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveInitialTheme, toggleThemeValue } from './theme';

test('resolveInitialTheme honors explicit saved preference over OS preference', () => {
  assert.equal(resolveInitialTheme('dark', false), 'dark');
  assert.equal(resolveInitialTheme('light', true), 'light');
});

test('resolveInitialTheme falls back to OS preference when storage is empty or invalid', () => {
  assert.equal(resolveInitialTheme(null, true), 'dark');
  assert.equal(resolveInitialTheme(null, false), 'light');
  assert.equal(resolveInitialTheme('system', true), 'dark');
  assert.equal(resolveInitialTheme('', false), 'light');
});

test('toggleThemeValue alternates cleanly between light and dark', () => {
  assert.equal(toggleThemeValue('light'), 'dark');
  assert.equal(toggleThemeValue('dark'), 'light');
});
