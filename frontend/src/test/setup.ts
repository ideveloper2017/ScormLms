import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Mock ResizeObserver for Radix UI components
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock as any;

// jsdom does not implement canvas drawing/encoding. These lightweight mocks
// exercise the camera capture flow without depending on a native canvas package.
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  value: vi.fn(() => ({ drawImage: vi.fn() })),
});
Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
  configurable: true,
  value: vi.fn((callback: BlobCallback) => callback(new Blob(['face-photo'], { type: 'image/jpeg' }))),
});
Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
  configurable: true,
  value: vi.fn(() => 'data:image/jpeg;base64,dGVzdA=='),
});

// Cleanup after each test case
afterEach(() => {
  cleanup();
});
