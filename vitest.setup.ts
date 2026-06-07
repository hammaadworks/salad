import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Electron
vi.mock('electron', () => ({
  ipcRenderer: {
    on: vi.fn(),
    send: vi.fn(),
    invoke: vi.fn(),
    removeListener: vi.fn(),
    removeAllListeners: vi.fn(),
  },
  shell: {
    openExternal: vi.fn(),
  },
}));

// Mock window.require
window.require = ((module: string) => {
  if (module === 'electron') {
    return {
      ipcRenderer: {
        on: vi.fn(),
        send: vi.fn(),
        invoke: vi.fn(),
        removeListener: vi.fn(),
        removeAllListeners: vi.fn(),
      },
    };
  }
  return {};
}) as any;
