import "@testing-library/jest-dom";
import { vi } from 'vitest';

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

const originalWarn = console.warn;

vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
  const firstArg = args[0];
  const message = typeof firstArg === 'string' ? firstArg : '';

  if (message.includes('React Router Future Flag Warning')) {
    return;
  }

  originalWarn(...args);
});
