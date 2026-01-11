import { useState, useEffect } from 'react'
import { Camera, Video, Clipboard, FileText, Activity, Settings, X, Check, MousePointer2, Folder, PlayCircle, Box } from 'lucide-react'
import ClipboardTool from './components/ClipboardTool'
import ScreenshotTool from './components/ScreenshotTool'
import MindMapTool from './components/MindMapTool'
import MouseEventsTool from './components/MouseEventsTool'
import BoundingBoxTool from './components/BoundingBoxTool'
import QuickNote from './components/QuickNote'
import OnboardingTutorial from './components/OnboardingTutorial'
import { ipcRenderer } from 'electron'

const menuItems = [
  { id: 'screenshot', icon: Camera, label: 'Screenshot' },
  { id: 'record', icon: Video, label: 'Record' },
  { id: 'clipboard', icon: Clipboard, label: 'Clipboard' },
  { id: 'notes', icon: FileText, label: 'Notes' },
  { id: 'mindmap', icon: Activity, label: 'Mind Map' },
  { id: 'mouse-events', icon: MousePointer2, label: 'Mouse Events' },
  { id: 'bounding-box', icon: Box, label: 'Bounding Box Reference' },
]

function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [showSettings, setShowSettings] = useState(false)
  const [shortcut, setShortcut] = useState('CommandOrControl+Shift+G')
  const [tempShortcut, setTempShortcut] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [saveLocation, setSaveLocation] = useState('')
  const [isQuickNote, setIsQuickNote] = useState(window.location.hash === '#/quicknote')
  const [showTutorial, setShowTutorial] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    // Check if tutorial has been seen
    const hasSeen = localStorage.getItem('tutorialSeen')
    if (!hasSeen) {
      setShowTutorial(true)
    }

    const handleHashChange = () => {
      setIsQuickNote(window.location.hash === '#/quicknote')
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    if (activeTab === 'home') {
      setSelectedIndex(0)
    }
  }, [activeTab])

  useEffect(() => {
    // Load initial settings
    ipcRenderer.on('settings-loaded', (_event, settings) => {
      if (settings?.globalShortcut) {
        setShortcut(settings.globalShortcut)
      }
      if (settings?.quickNoteSaveLocation) {
        setSaveLocation(settings.quickNoteSaveLocation)
      }
    })
    ipcRenderer.send('get-settings') // Request on mount

    return () => {
       ipcRenderer.removeAllListeners('settings-loaded')
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shortcuts for menu items
      if (activeTab === 'home' && !showSettings && !showTutorial && !isQuickNote && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const key = e.key.toLowerCase()
        const digit = parseInt(key)

        // Arrow Key Navigation
        const cols = window.innerWidth >= 768 ? 5 : 4
        
        if (e.key === 'ArrowRight') {
           setSelectedIndex(prev => (prev + 1) % menuItems.length)
        } else if (e.key === 'ArrowLeft') {
           setSelectedIndex(prev => (prev - 1 + menuItems.length) % menuItems.length)
        } else if (e.key === 'ArrowDown') {
           setSelectedIndex(prev => {
             const next = prev + cols
             return next < menuItems.length ? next : prev
           })
        } else if (e.key === 'ArrowUp') {
           setSelectedIndex(prev => {
             const next = prev - cols
             return next >= 0 ? next : prev
           })
        } else if (e.key === 'Enter') {
           setActiveTab(menuItems[selectedIndex].id)
        }

        let index = -1
        
        // Handle 1-9
        if (!isNaN(digit) && digit >= 1 && digit <= 9) {
          index = digit - 1
        } 
        // Handle A-Z (for items >= 10, mapped to indices >= 9)
        else if (/^[a-z]$/.test(key)) {
          // 'a' (code 97) should map to index 9
          index = key.charCodeAt(0) - 97 + 9
        }

        if (index >= 0 && index < menuItems.length) {
          setActiveTab(menuItems[index].id)
        }
      }

      if (e.key === 'Escape') {
        if (showSettings) {
          setShowSettings(false)
        } else if (activeTab !== 'home') {
          setActiveTab('home')
        } else {
          // Only hide if main window
          if (!isQuickNote) ipcRenderer.send('hide-window')
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTab, showSettings, showTutorial, isQuickNote, menuItems, selectedIndex]) // Added menuItems to dep array just in case

  const handleRecordShortcut = (e: React.KeyboardEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const modifiers = []
    if (e.metaKey) modifiers.push('Command')
    if (e.ctrlKey) modifiers.push('Control')
    if (e.altKey) modifiers.push('Alt')
    if (e.shiftKey) modifiers.push('Shift')
    
    let key = e.key.toUpperCase()
    if (key === 'META' || key === 'CONTROL' || key === 'ALT' || key === 'SHIFT') return

    // Convert standard keys to Electron format if needed
    if (key === ' ') key = 'Space'

    const combo = [...modifiers, key].join('+')
    setTempShortcut(combo)
  }

  const saveShortcut = () => {
    let finalShortcut = tempShortcut.replace('Command', 'CommandOrControl').replace('Control', 'CommandOrControl')
    
    ipcRenderer.send('update-shortcut', finalShortcut)
    ipcRenderer.once('shortcut-updated', (_event, { success }) => {
        if (success) {
            setShortcut(finalShortcut)
            setIsRecording(false)
            setTempShortcut('')
        } else {
            alert('Failed to register shortcut. It might be invalid or taken.')
        }
    })
  }

  const handleChangeSaveLocation = async () => {
    const path = await ipcRenderer.invoke('select-folder');
    if (path) {
       setSaveLocation(path);
       ipcRenderer.send('save-settings', { quickNoteSaveLocation: path });
    }
  }

  if (isQuickNote) {
    return <QuickNote />
  }
  
  // Render Tutorial if needed
  if (showTutorial) {
    return (
      <OnboardingTutorial 
        onComplete={() => {
          localStorage.setItem('tutorialSeen', 'true')
          setShowTutorial(false)
        }} 
      />
    )
  }

  if (activeTab === 'screenshot') {
    return <ScreenshotTool onClose={() => setActiveTab('home')} />
  }

  if (activeTab === 'mouse-events') {
    return <MouseEventsTool onClose={() => setActiveTab('home')} />
  }
  
  if (activeTab === 'clipboard') {
    return <ClipboardTool onClose={() => { setActiveTab('home'); ipcRenderer.send('hide-window'); }} />
  }

  if (activeTab === 'notes') {
    return (
      <QuickNote 
        onClose={() => {
          setActiveTab('home')
          ipcRenderer.send('hide-window')
        }} 
      />
    )
  }

  if (activeTab === 'mindmap') {
     useEffect(() => {
        ipcRenderer.send('set-fullscreen', true)
        return () => ipcRenderer.send('set-fullscreen', false)
     }, [])
     return <MindMapTool onClose={() => setActiveTab('home')} />
  }

  if (activeTab === 'bounding-box') {
      return <BoundingBoxTool onClose={() => setActiveTab('home')} />
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-zinc-950/90 backdrop-blur-2xl rounded-xl border border-white/10 p-8 text-white">
      <div className="text-3xl font-bold mb-8 tracking-tight flex items-center gap-3">
        <img src="/icon.svg" alt="Salad Logo" className="w-10 h-10" />
        Salad
      </div>
      
      <div className="grid grid-cols-4 md:grid-cols-5 gap-6 w-full max-w-4xl">
        {menuItems.map((item, index) => {
          let badgeLabel = ''
          if (index < 9) {
            badgeLabel = (index + 1).toString()
          } else {
            // Index 9 -> 'A', Index 10 -> 'B', etc.
            badgeLabel = String.fromCharCode(65 + (index - 9))
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center p-6 rounded-xl transition-all hover:scale-105 active:scale-95 group border ${index === selectedIndex ? 'bg-white/10 ring-2 ring-green-500 border-transparent' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'}`}
            >
              {/* Shortcut Badge */}
              <div className="absolute top-3 left-3 w-6 h-6 flex items-center justify-center bg-black/60 rounded-full text-xs text-white/70 border border-white/10 font-mono">
                  {badgeLabel}
              </div>

              <item.icon className="w-10 h-10 mb-3 text-zinc-400 group-hover:text-green-400 transition-colors" />
              <span className="text-base font-medium text-zinc-300 group-hover:text-white transition-colors">{item.label}</span>
            </button>
          )
        })}
      </div>

      {/* Settings Button */}
      <button 
        onClick={() => setShowSettings(true)}
        className="absolute top-4 right-4 p-2 text-white/30 hover:text-white transition-colors"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center rounded-xl">
           <div className="bg-zinc-900 border border-white/10 p-6 rounded-lg w-96 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold">Settings</h2>
                  <button onClick={() => setShowSettings(false)}><X className="w-5 h-5 text-zinc-500 hover:text-white"/></button>
              </div>
              
              <div className="mb-4">
                  <label className="block text-sm text-zinc-400 mb-2">Global Shortcut</label>
                  <div className="flex gap-2">
                      <div 
                        className={`flex-1 bg-black/50 border ${isRecording ? 'border-blue-500 text-white' : 'border-white/10 text-zinc-400'} rounded px-3 py-2 text-sm flex items-center justify-center cursor-pointer`}
                        onClick={() => { setIsRecording(true); setTempShortcut('') }}
                        onKeyDown={isRecording ? handleRecordShortcut : undefined}
                        tabIndex={0}
                      >
                          {isRecording ? (tempShortcut || 'Press keys...') : shortcut}
                      </div>
                      {isRecording && (
                          <button onClick={saveShortcut} className="p-2 bg-blue-600 hover:bg-blue-500 rounded text-white">
                              <Check className="w-4 h-4" />
                          </button>
                      )}
                  </div>
                  {isRecording && <p className="text-xs text-zinc-500 mt-2">Click check to save.</p>}
              </div>

              <div className="mb-4">
                  <label className="block text-sm text-zinc-400 mb-2">Save Location</label>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-zinc-400 truncate" title={saveLocation}>
                        {saveLocation || 'Desktop'}
                    </div>
                    <button onClick={handleChangeSaveLocation} className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded text-white">
                        <Folder className="w-4 h-4" />
                    </button>
                  </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10">
                 <button 
                    onClick={() => { setShowTutorial(true); setShowSettings(false); }}
                    className="w-full flex items-center justify-center gap-2 p-2 rounded bg-white/5 hover:bg-white/10 text-sm text-zinc-300 transition-colors"
                 >
                    <PlayCircle className="w-4 h-4" />
                    Watch Tutorial
                 </button>
              </div>

           </div>
        </div>
      )}

      <div className="mt-8 text-white/50 text-xs">
        Active: {activeTab} | Press {shortcut.replace('CommandOrControl', 'Cmd')} to toggle
      </div>
    </div>
  )
}

export default App
