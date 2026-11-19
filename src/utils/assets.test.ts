import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveAssetUrl } from './assets';

test('resolveAssetUrl adapts local image paths for root dev and GitHub Pages subpaths', () => {
  assert.equal(
    resolveAssetUrl('/src/assets/images/size_apple.jpg', './'),
    './src/assets/images/size_apple.jpg'
  );
  assert.equal(
    resolveAssetUrl('/src/assets/images/size_apple.jpg', '/'),
    '/src/assets/images/size_apple.jpg'
  );
  assert.equal(
    resolveAssetUrl('/src/assets/images/size_apple.jpg', '/bloomweeks'),
    '/bloomweeks/src/assets/images/size_apple.jpg'
  );
  assert.equal(
    resolveAssetUrl('https://example.com/photo.jpg', './'),
    'https://example.com/photo.jpg'
  );
});
