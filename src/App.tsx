import { useEffect } from 'react'
import { Settings as SettingsIcon, Power, X, Pin, PinOff, Package, LayoutGrid } from 'lucide-react'
import { ipcRenderer } from 'electron'
import { ToolRegistry } from './registry'
import { useAppStore } from './store'
import SettingsModal from './components/SettingsModal'
import OnboardingTutorial from './components/OnboardingTutorial'
import NavigationStrip from './components/NavigationStrip'
import CommunityTools from './components/CommunityTools'
import { cn } from './utils'

function App() {
  const { 
    activeTab, 
    setActiveTab, 
    viewMode,
    setViewMode,
    showSettings, 
    setShowSettings, 
    showTutorial,
    setShowTutorial,
    pinnedToolIds,
    togglePin,
    initialize
  } = useAppStore()

  useEffect(() => {
    const handleSwitchTab = (_e: any, tab: string) => {
      setActiveTab(tab)
      setViewMode('mini')
    }
    ipcRenderer.on('switch-tab', handleSwitchTab)
    ipcRenderer.on('open-settings', () => setShowSettings(true))
    ipcRenderer.on('settings-loaded', (_e, settings) => {
      if (settings.pinnedToolIds) {
        initialize({ pinnedToolIds: settings.pinnedToolIds })
      }
      if (settings.activeTab) {
        initialize({ activeTab: settings.activeTab })
      }
    })
    ipcRenderer.send('get-settings')
    return () => {
      ipcRenderer.removeAllListeners('switch-tab')
      ipcRenderer.removeAllListeners('open-settings')
      ipcRenderer.removeAllListeners('settings-loaded')
    }
  }, [setActiveTab, setShowSettings, setViewMode, initialize])

  useEffect(() => {
    ipcRenderer.send('set-view-mode', viewMode)
  }, [viewMode])

  const ActiveTool = ToolRegistry.find(t => t.id === activeTab)

  const handleQuit = () => ipcRenderer.send('quit-app')

  // Keyboard Shortcuts (1-9)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const num = parseInt(e.key)
      if (num >= 1 && num <= 9) {
        if (num === 5) {
          setViewMode('full')
          setActiveTab('home')
        } else {
          const idx = num < 5 ? num - 1 : num - 2
          const toolId = pinnedToolIds[idx]
          if (toolId) {
            setActiveTab(toolId)
            setViewMode('mini')
          }
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pinnedToolIds, setActiveTab, setViewMode])

  return (
    <div className={cn(
      "h-screen w-screen text-zinc-200 overflow-hidden relative flex selection:bg-blue-500/30 transition-colors duration-300",
      viewMode === 'full' || (activeTab !== 'home' && activeTab !== 'community') ? "bg-zinc-950" : "bg-transparent"
    )}>
      {/* NAVIGATION STRIP (Mini Mode + Home only) */}
      {viewMode === 'mini' && activeTab === 'home' && (
        <NavigationStrip />
      )}

      {/* FULL VIEW OR TOOL CONTENT */}
      <main className={cn(
        "flex-1 relative flex flex-col z-10 transition-all duration-300",
        viewMode === 'full' || (activeTab !== 'home' && activeTab !== 'community') 
          ? "bg-zinc-950 opacity-100 translate-x-0" 
          : "bg-transparent opacity-0 -translate-x-4 pointer-events-none"
      )}>
        {/* Full View / Tool Store */}
        {viewMode === 'full' && activeTab === 'home' && (
          <div className="flex flex-col h-full w-full">
            <header className="h-16 flex items-center justify-between px-8 shrink-0 border-b border-white/5 bg-zinc-950/50 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <img src="./icon.svg" alt="Salad" className="w-6 h-6" />
                <h1 className="text-xl font-bold text-white tracking-tight">Salad</h1>
                <nav className="flex items-center gap-1 ml-8 p-1 bg-white/5 rounded-xl border border-white/5">
                  <button 
                    onClick={() => setActiveTab('home')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                      String(activeTab) === 'home' ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" /> My Tools
                  </button>
                  <button 
                    onClick={() => setActiveTab('community')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                      String(activeTab) === 'community' ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    <Package className="w-3.5 h-3.5" /> Community
                  </button>
                </nav>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowSettings(true)}
                  className="p-2 text-zinc-500 hover:text-white transition-colors"
                >
                  <SettingsIcon className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleQuit}
                  className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                  title="Exit Salad"
                >
                  <Power className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setViewMode('mini')}
                  className="ml-4 flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-white transition-colors"
                >
                  Minimize <X className="w-4 h-4" />
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-12">
               <div className="max-w-6xl mx-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {ToolRegistry.map((tool) => {
                      const isPinned = pinnedToolIds.includes(tool.id)
                      return (
                        <div
                          key={tool.id}
                          className="group relative flex flex-col items-start p-5 pro-card hover:ring-1 hover:ring-blue-500/50"
                        >
                          <div className="flex w-full justify-between items-start mb-4">
                            <div className="p-2 rounded-lg bg-zinc-950 border border-white/5 text-zinc-500 group-hover:text-blue-500 transition-colors">
                              <tool.icon className="w-5 h-5" />
                            </div>
                            <button 
                              onClick={() => togglePin(tool.id)}
                              className={cn(
                                "p-2 rounded-lg transition-colors",
                                isPinned ? "text-blue-500 bg-blue-500/10" : "text-zinc-600 hover:text-zinc-300 bg-white/5"
                              )}
                              title={isPinned ? "Unpin from Strip" : "Pin to Strip"}
                            >
                              {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                            </button>
                          </div>
                          
                          <h3 className="font-semibold text-sm text-zinc-100 mb-1">{tool.label}</h3>
                          <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2 mb-6">{tool.problem}</p>
                          
                          <button
                            onClick={() => { setActiveTab(tool.id); setViewMode('mini'); }}
                            className="mt-auto w-full py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 border border-white/5 rounded-lg hover:bg-white/5 hover:text-white transition-all"
                          >
                            Launch Tool
                          </button>
                        </div>
                      )
                    })}
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* Community View */}
        {viewMode === 'full' && activeTab === 'community' && (
          <div className="flex flex-col h-full w-full">
            <header className="h-16 flex items-center justify-between px-8 shrink-0 border-b border-white/5 bg-zinc-950/50 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <img src="./icon.svg" alt="Salad" className="w-6 h-6" />
                <h1 className="text-xl font-bold text-white tracking-tight">Salad</h1>
                <nav className="flex items-center gap-1 ml-8 p-1 bg-white/5 rounded-xl border border-white/5">
                  <button 
                    onClick={() => setActiveTab('home')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                      String(activeTab) === 'home' ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" /> My Tools
                  </button>
                  <button 
                    onClick={() => setActiveTab('community')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                      String(activeTab) === 'community' ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    <Package className="w-3.5 h-3.5" /> Community
                  </button>
                </nav>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowSettings(true)}
                  className="p-2 text-zinc-500 hover:text-white transition-colors"
                >
                  <SettingsIcon className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleQuit}
                  className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                  title="Exit Salad"
                >
                  <Power className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setViewMode('mini')}
                  className="ml-4 flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-white transition-colors"
                >
                  Minimize <X className="w-4 h-4" />
                </button>
              </div>
            </header>
            <div className="flex-1 overflow-hidden">
              <CommunityTools />
            </div>
          </div>
        )}

        {/* Tool Content Area */}
        {activeTab !== 'home' && activeTab !== 'community' && ActiveTool && (
          <div className="flex flex-col h-full w-full">
            <header className="h-14 flex items-center justify-between px-8 shrink-0 border-b border-white/5 bg-zinc-950/50 backdrop-blur-md">
              <h2 className="text-sm font-semibold text-zinc-100">{ActiveTool.label}</h2>
              <button 
                onClick={() => { setActiveTab('home'); setViewMode('mini'); }}
                className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest">Back to Strip</span>
                <X className="w-4 h-4" />
              </button>
            </header>
            <div className="flex-1 overflow-auto">
              <div className={cn(
                "h-full w-full animate-fade-in",
                ActiveTool.fullscreen ? "fixed inset-0 z-[100] bg-zinc-950" : "p-8"
              )}>
                <ActiveTool.component onClose={() => { setActiveTab('home'); setViewMode('mini'); }} />
              </div>
            </div>
          </div>
        )}
      </main>

      {showSettings && <SettingsModal />}
      {showTutorial && <OnboardingTutorial onComplete={() => setShowTutorial(false)} />}
    </div>
  )
}

export default App
