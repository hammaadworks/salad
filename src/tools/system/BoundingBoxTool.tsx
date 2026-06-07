import React, { useState, useEffect, useRef } from 'react'
import { EyeOff, Layout, Trash2, Save, Link, Unlink, Check, ChevronDown } from 'lucide-react'
import { ipcRenderer } from 'electron'
import Toolbar from '../../components/Toolbar'

interface BoundingBox {
  id: string
  x: number
  y: number
  width: number
  height: number
  label: string
  color: string
  aspectRatio?: number | null
}

interface SavedConfig {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  color: string
}

const DEFAULT_PRESETS = [
  { id: 'tiktok', name: 'TikTok (9:16)', width: 340, height: 600, ratio: 9/16 },
  { id: 'insta', name: 'Insta (4:5)', width: 400, height: 500, ratio: 4/5 },
  { id: 'square', name: 'Square (1:1)', width: 400, height: 400, ratio: 1 },
  { id: 'wide', name: 'YouTube (16:9)', width: 640, height: 360, ratio: 16/9 },
]

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6']

export default function BoundingBoxTool({ onClose }: { onClose: () => void }) {
  const [boxes, setBoxes] = useState<BoundingBox[]>([])
  const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>([])
  const [hidden, setHidden] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [resizingId, setResizingId] = useState<{ id: string, handle: string } | null>(null)
  const [newConfigName, setNewConfigName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState<string | null>(null)
  
  const initialPos = useRef({ x: 0, y: 0 })
  const initialBox = useRef<BoundingBox | null>(null)
  const lastInteractiveRef = useRef<boolean | null>(null)

  // Initialization
  useEffect(() => {
    ipcRenderer.send('get-settings')
    ipcRenderer.on('settings-loaded', (_event, settings) => {
      if (settings.savedBoundingBoxes) {
        setSavedConfigs(settings.savedBoundingBoxes)
      }
      if (settings.activeBoxes && settings.activeBoxes.length > 0) {
          setBoxes(settings.activeBoxes)
      } else {
          // Default
          setBoxes([{ id: 'default', x: 100, y: 100, width: 340, height: 600, label: 'Reference', color: '#10b981' }])
      }
    })

    ipcRenderer.send('set-fullscreen', true)
    return () => {
      ipcRenderer.send('set-fullscreen', false)
      ipcRenderer.send('set-ignore-mouse-events', false)
      ipcRenderer.removeAllListeners('settings-loaded')
    }
  }, [])

  const saveToSettings = (updatedBoxes: BoundingBox[], updatedConfigs?: SavedConfig[]) => {
      const settings: any = { activeBoxes: updatedBoxes }
      if (updatedConfigs) settings.savedBoundingBoxes = updatedConfigs
      ipcRenderer.send('save-settings', settings)
  }

  // --- Interaction Logic ---
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingId || resizingId) return

    const target = e.target as HTMLElement
    const isInteractive = !!target.closest('.interactive-zone')

    if (isInteractive !== lastInteractiveRef.current) {
      ipcRenderer.send('set-ignore-mouse-events', !isInteractive, { forward: true })
      lastInteractiveRef.current = isInteractive
    }
  }

  const startDrag = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const box = boxes.find(b => b.id === id)
    if (!box) return
    initialBox.current = { ...box }
    initialPos.current = { x: e.clientX, y: e.clientY }
    setDraggingId(id)
    ipcRenderer.send('set-ignore-mouse-events', false)
  }

  const startResize = (e: React.MouseEvent, id: string, handle: string) => {
    e.stopPropagation()
    const box = boxes.find(b => b.id === id)
    if (!box) return
    initialBox.current = { ...box }
    initialPos.current = { x: e.clientX, y: e.clientY }
    setResizingId({ id, handle })
    ipcRenderer.send('set-ignore-mouse-events', false)
  }

  useEffect(() => {
    const onGlobalMove = (e: MouseEvent) => {
      if (draggingId && initialBox.current) {
        const dx = e.clientX - initialPos.current.x
        const dy = e.clientY - initialPos.current.y
        setBoxes(prev => prev.map(b => b.id === draggingId ? { ...b, x: initialBox.current!.x + dx, y: initialBox.current!.y + dy } : b))
      } else if (resizingId && initialBox.current) {
        const dx = e.clientX - initialPos.current.x
        const dy = e.clientY - initialPos.current.y
        const { id, handle } = resizingId
        
        setBoxes(prev => prev.map(b => {
          if (b.id !== id) return b
          let { x, y, width, height, aspectRatio } = b
          const original = initialBox.current!

          if (handle.includes('right')) width = original.width + dx
          if (handle.includes('left')) { x = original.x + dx; width = original.width - dx }
          if (handle.includes('bottom')) height = original.height + dy
          if (handle.includes('top')) { y = original.y + dy; height = original.height - dy }

          // Enforce Aspect Ratio if linked
          if (aspectRatio) {
              if (Math.abs(dx) > Math.abs(dy)) {
                  height = width / aspectRatio
              } else {
                  width = height * aspectRatio
              }
          }

          return { ...b, x, y, width: Math.max(50, width), height: Math.max(50, height) }
        }))
      }
    }

    const onGlobalUp = () => {
      if (draggingId || resizingId) {
          saveToSettings(boxes)
      }
      setDraggingId(null)
      setResizingId(null)
    }

    if (draggingId || resizingId) {
      window.addEventListener('mousemove', onGlobalMove)
      window.addEventListener('mouseup', onGlobalUp)
    }
    return () => {
      window.removeEventListener('mousemove', onGlobalMove)
      window.removeEventListener('mouseup', onGlobalUp)
    }
  }, [draggingId, resizingId, boxes])

  // --- Actions ---

  const addPreset = (preset: typeof DEFAULT_PRESETS[0]) => {
    const newBox: BoundingBox = {
      id: Date.now().toString(),
      x: window.innerWidth / 2 - preset.width / 2,
      y: window.innerHeight / 2 - preset.height / 2,
      width: preset.width,
      height: preset.height,
      label: preset.name,
      color: COLORS[boxes.length % COLORS.length],
      aspectRatio: preset.ratio
    }
    const newBoxes = [...boxes, newBox]
    setBoxes(newBoxes)
    saveToSettings(newBoxes)
  }

  const applyConfig = (config: SavedConfig) => {
      const newBox: BoundingBox = {
          id: Date.now().toString(),
          x: config.x,
          y: config.y,
          width: config.width,
          height: config.height,
          label: config.name,
          color: config.color
      }
      const newBoxes = [...boxes, newBox]
      setBoxes(newBoxes)
      saveToSettings(newBoxes)
  }

  const saveCurrentConfig = (id: string) => {
      const box = boxes.find(b => b.id === id)
      if (!box || !newConfigName.trim()) return

      const newSaved: SavedConfig = {
          id: Date.now().toString(),
          name: newConfigName,
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
          color: box.color
      }
      const updated = [...savedConfigs, newSaved]
      setSavedConfigs(updated)
      saveToSettings(boxes, updated)
      setNewConfigName('')
      setShowSaveDialog(null)
  }

  const deleteBox = (id: string) => {
      const updated = boxes.filter(b => b.id !== id)
      setBoxes(updated)
      saveToSettings(updated)
      if (updated.length === 0) onClose()
  }

  if (hidden) {
      return (
          <div className="fixed top-4 left-4 z-50 interactive-zone">
              <button 
                onClick={() => setHidden(false)}
                className="bg-zinc-900 text-white px-4 py-2 rounded-xl shadow-2xl border border-white/10 flex items-center gap-2 hover:bg-zinc-800 transition-all font-bold"
              >
                  <Layout className="w-5 h-5 text-green-400" />
                  Show Reference Guides
              </button>
          </div>
      )
  }

  return (
    <div className="w-screen h-screen relative overflow-hidden" onMouseMove={handleMouseMove}>
      {/* Global Toolbar */}
      <Toolbar onClose={onClose} className="top-6 left-1/2 -translate-x-1/2 scale-110">
        <div className="flex items-center gap-3 px-2">
            <div className="flex items-center gap-1 border-r border-white/5 pr-3 mr-1">
                <Layout className="w-4 h-4 text-zinc-500" />
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Presets</span>
            </div>
            
            {DEFAULT_PRESETS.map(p => (
                <button 
                    key={p.id} 
                    onClick={() => addPreset(p)}
                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] font-mono border border-white/5 transition-all text-zinc-300"
                >
                    {p.name.split(' ')[0]}
                </button>
            ))}

            <div className="w-px h-6 bg-white/10 mx-1" />

            {/* Saved Configurations Dropdown */}
            <div className="relative group/saved">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all text-xs font-bold">
                    Saved Layouts <ChevronDown className="w-3 h-3" />
                </button>
                <div className="absolute top-full left-0 mt-2 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover/saved:opacity-100 group-hover/saved:visible transition-all z-50 overflow-hidden">
                    {savedConfigs.length === 0 ? (
                        <div className="p-4 text-[10px] text-zinc-500 text-center">No saved layouts</div>
                    ) : (
                        savedConfigs.map(c => (
                            <button 
                                key={c.id} 
                                onClick={() => applyConfig(c)}
                                className="w-full text-left px-4 py-2 text-xs hover:bg-white/5 flex items-center justify-between group/item"
                            >
                                <span className="truncate">{c.name}</span>
                                <Trash2 
                                    className="w-3 h-3 text-zinc-600 hover:text-red-400 opacity-0 group-hover/item:opacity-100" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const updated = savedConfigs.filter(sc => sc.id !== c.id);
                                        setSavedConfigs(updated);
                                        saveToSettings(boxes, updated);
                                    }}
                                />
                            </button>
                        ))
                    )}
                </div>
            </div>

            <button onClick={() => setHidden(true)} className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 transition-colors ml-2" title="Hide All">
                <EyeOff className="w-5 h-5" />
            </button>
        </div>
      </Toolbar>

      {boxes.map(box => (
        <div
          key={box.id}
          style={{
            left: box.x,
            top: box.y,
            width: box.width,
            height: box.height,
            borderColor: box.color,
            boxShadow: `0 0 20px ${box.color}20`
          }}
          className="absolute border-2 pointer-events-none group"
        >
            {/* Box Header Toolbar */}
            <div 
                className="absolute -top-12 left-0 min-w-[280px] h-10 flex items-center gap-2 px-3 bg-zinc-950/90 backdrop-blur rounded-xl interactive-zone pointer-events-auto cursor-move border border-white/10 shadow-2xl transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                onMouseDown={(e) => startDrag(e, box.id)}
            >
                {/* Ratio Toggle */}
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        setBoxes(prev => prev.map(b => b.id === box.id ? { ...b, aspectRatio: b.aspectRatio ? null : b.width/b.height } : b))
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${box.aspectRatio ? 'bg-blue-500 text-white' : 'text-zinc-500 hover:bg-white/5'}`}
                    title="Lock Aspect Ratio"
                >
                    {box.aspectRatio ? <Link className="w-4 h-4" /> : <Unlink className="w-4 h-4" />}
                </button>

                <div className="w-px h-4 bg-white/10 mx-1" />

                {/* Dimension Inputs */}
                <div className="flex items-center gap-1 font-mono text-[11px] text-zinc-400">
                    <input 
                        type="number" 
                        value={Math.round(box.width)}
                        onChange={(e) => {
                            const val = parseInt(e.target.value) || 50
                            setBoxes(prev => prev.map(b => b.id === box.id ? { ...b, width: val, height: b.aspectRatio ? val / b.aspectRatio : b.height } : b))
                        }}
                        className="w-12 bg-transparent outline-none text-right focus:text-white"
                        onMouseDown={e => e.stopPropagation()}
                    />
                    <span className="opacity-30">×</span>
                    <input 
                        type="number" 
                        value={Math.round(box.height)}
                        onChange={(e) => {
                            const val = parseInt(e.target.value) || 50
                            setBoxes(prev => prev.map(b => b.id === box.id ? { ...b, height: val, width: b.aspectRatio ? val * b.aspectRatio : b.width } : b))
                        }}
                        className="w-12 bg-transparent outline-none focus:text-white"
                        onMouseDown={e => e.stopPropagation()}
                    />
                </div>

                <div className="flex-1" />

                {/* Save Current Logic */}
                {showSaveDialog === box.id ? (
                    <div className="flex items-center gap-1 animate-in slide-in-from-right-2" onMouseDown={e => e.stopPropagation()}>
                        <input 
                            autoFocus
                            placeholder="Name..."
                            value={newConfigName}
                            onChange={e => setNewConfigName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && saveCurrentConfig(box.id)}
                            className="w-24 bg-white/10 border border-white/10 rounded px-2 py-0.5 text-[10px] outline-none"
                        />
                        <button onClick={() => saveCurrentConfig(box.id)} className="p-1 text-green-400 hover:bg-white/5 rounded"><Check className="w-3 h-3"/></button>
                        <button onClick={() => setShowSaveDialog(null)} className="p-1 text-zinc-500 hover:bg-white/5 rounded"><X className="w-3 h-3"/></button>
                    </div>
                ) : (
                    <button 
                        onClick={(e) => { e.stopPropagation(); setShowSaveDialog(box.id) }}
                        className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-blue-400 transition-colors"
                        title="Save Layout"
                    >
                        <Save className="w-4 h-4" />
                    </button>
                )}

                <button 
                    onClick={(e) => { e.stopPropagation(); deleteBox(box.id) }}
                    className="p-1.5 hover:bg-red-500/20 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Resize Handles */}
            {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(h => (
                <div
                    key={h}
                    onMouseDown={(e) => startResize(e, box.id, h)}
                    className={`absolute w-4 h-4 interactive-zone pointer-events-auto z-10 transition-transform hover:scale-150
                        ${h.includes('top') ? '-top-2' : '-bottom-2'} 
                        ${h.includes('left') ? '-left-2' : '-right-2'}
                        ${h.includes('top-left') || h.includes('bottom-right') ? 'cursor-nwse-resize' : 'cursor-nesw-resize'}
                    `}
                >
                    <div className="w-full h-full bg-white/20 backdrop-blur rounded-full border border-white/40 flex items-center justify-center">
                        <div className="w-1 h-1 bg-white rounded-full" />
                    </div>
                </div>
            ))}

            {/* Dimensions Label (Subtle) */}
            <div className="absolute -bottom-6 left-0 text-[9px] font-mono text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
                {Math.round(box.x)},{Math.round(box.y)} | {Math.round(box.width)}×{Math.round(box.height)}
            </div>
        </div>
      ))}
    </div>
  )
}

function X({ className }: { className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
}

