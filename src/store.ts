import { create } from 'zustand'
import { ToolRegistry } from './registry'

interface AppSettings {
  autoHide: boolean
  startOnLogin: boolean
  shortcut: string
  theme: 'dark' | 'light'
}

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  provider: 'google' | 'github'
}

interface AppState {
  activeTab: string
  setActiveTab: (tab: string, persist?: boolean) => void
  
  viewMode: 'mini' | 'full'
  setViewMode: (mode: 'mini' | 'full') => void
  
  pinnedToolIds: string[]
  setPinnedToolIds: (ids: string[], persist?: boolean) => void
  togglePin: (id: string) => void

  settings: AppSettings
  setSettings: (settings: Partial<AppSettings>) => void
  
  showTutorial: boolean
  setShowTutorial: (show: boolean) => void
  
  showSettings: boolean
  setShowSettings: (show: boolean) => void

  user: User | null
  setUser: (user: User | null) => void

  initialize: (data: Partial<AppState>) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'home',
  setActiveTab: (tab, persist = true) => {
    set({ activeTab: tab });
    if (persist) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('save-active-tab', tab);
    }
  },
  
  viewMode: 'mini',
  setViewMode: (mode) => set({ viewMode: mode }),

  pinnedToolIds: ToolRegistry.slice(0, 8).map(t => t.id),
  setPinnedToolIds: (ids, persist = true) => {
    set({ pinnedToolIds: ids });
    if (persist) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('save-pinned-tools', ids);
    }
  },
  togglePin: (id) => set((state) => {
    const newIds = state.pinnedToolIds.includes(id)
      ? state.pinnedToolIds.filter(pid => pid !== id)
      : [id, ...state.pinnedToolIds].slice(0, 8);
    
    const { ipcRenderer } = window.require('electron');
    ipcRenderer.send('save-pinned-tools', newIds);
    
    return { pinnedToolIds: newIds };
  }),
  
  settings: {
    autoHide: true,
    startOnLogin: false,
    shortcut: 'CommandOrControl+Shift+G',
    theme: 'dark',
  },
  setSettings: (newSettings) => set((state) => ({ 
    settings: { ...state.settings, ...newSettings } 
  })),
  
  showTutorial: false,
  setShowTutorial: (show) => set({ showTutorial: show }),
  
  showSettings: false,
  setShowSettings: (show) => set({ showSettings: show }),

  user: null,
  setUser: (user) => set({ user }),

  initialize: (data) => set((state) => ({ ...state, ...data })),
}))
