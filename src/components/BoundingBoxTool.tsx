import React, { useState, useEffect, useRef } from 'react'
import { EyeOff, Layout, Trash2 } from 'lucide-react'
import { ipcRenderer } from 'electron'
import Toolbar from './Toolbar'

interface BoundingBox {
  id: string
  x: number
  y: number
  width: number
  height: number
  label: string
  color: string
}

interface Preset {
  id: string
  label: string
  width: number
  height: number
}

const DEFAULT_PRESETS: Preset[] = [
  { id: 'tiktok', label: 'TikTok (9:16)', width: 340, height: 600 },
  { id: 'insta', label: 'Insta (4:5)', width: 400, height: 500 },
  { id: 'square', label: 'Square (1:1)', width: 400, height: 400 },
  { id: 'wide', label: 'YouTube (16:9)', width: 600, height: 340 },
]

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6']

interface BoundingBoxToolProps {
  onClose: () => void
}

const BoundingBoxTool: React.FC<BoundingBoxToolProps> = ({ onClose }) => {
  const [boxes, setBoxes] = useState<BoundingBox[]>([])
  const [hidden, setHidden] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [resizingId, setResizingId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const containerRef = useRef<HTMLDivElement>(null)
  const lastInteractiveRef = useRef<boolean | null>(null)
  const initialBoxState = useRef<BoundingBox | null>(null)
  const isLoaded = useRef(false)

  // Load from Settings
  useEffect(() => {
    ipcRenderer.once('bounding-boxes-loaded', (_event, loadedBoxes) => {
      if (loadedBoxes && loadedBoxes.length > 0) {
        setBoxes(loadedBoxes)
      } else {
        // Default start if no settings
        setBoxes([{ id: '1', x: 100, y: 100, width: 340, height: 600, label: 'TikTok Ref', color: '#10b981' }])
      }
      isLoaded.current = true
    })
    ipcRenderer.send('get-bounding-boxes')

    // Enter full screen
    ipcRenderer.send('set-fullscreen', true)
    return () => {
      ipcRenderer.send('set-fullscreen', false)
      ipcRenderer.send('set-ignore-mouse-events', false)
    }
  }, [])

  // Save to Settings (Debounced slightly or just on every change since it's local FS)
  useEffect(() => {
    if (isLoaded.current) {
      ipcRenderer.send('save-bounding-boxes', boxes)
    }
  }, [boxes])

  // ... (Keep handleMouseMove, handleMouseDown, handleGlobalMouseMove, handleGlobalMouseUp logic same as previous step) ...
  // "Hole" Strategy Logic
  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingId || resizingId) return

    const target = e.target as HTMLElement
    const isInteractive = !!target.closest('.interactive-zone')

    if (isInteractive !== lastInteractiveRef.current) {
      if (isInteractive) {
        ipcRenderer.send('set-ignore-mouse-events', false)
      } else {
        ipcRenderer.send('set-ignore-mouse-events', true, { forward: true })
      }
      lastInteractiveRef.current = isInteractive
    }
  }

  const handleMouseDown = (e: React.MouseEvent, id: string, type: 'move' | 'resize') => {
    e.stopPropagation()
    const box = boxes.find(b => b.id === id)
    if (!box) return

    initialBoxState.current = { ...box }
    setDragOffset({ x: e.clientX, y: e.clientY })

    if (type === 'move') {
      setDraggingId(id)
    } else {
      setResizingId(id)
    }
  }

  const handleGlobalMouseMove = (e: MouseEvent) => {
    if (!initialBoxState.current) return

    const startX = dragOffset.x
    const startY = dragOffset.y
    const currentX = e.clientX
    const currentY = e.clientY
    const deltaX = currentX - startX
    const deltaY = currentY - startY

    if (draggingId) {
      setBoxes(prev => prev.map(box => {
        if (box.id === draggingId && initialBoxState.current) {
          return { 
            ...box, 
            x: initialBoxState.current.x + deltaX, 
            y: initialBoxState.current.y + deltaY 
          }
        }
        return box
      }))
    } else if (resizingId) {
        setBoxes(prev => prev.map(box => {
            if (box.id === resizingId && initialBoxState.current) {
              return { 
                  ...box, 
                  width: Math.max(100, initialBoxState.current.width + deltaX), 
                  height: Math.max(100, initialBoxState.current.height + deltaY) 
              }
            }
            return box
          }))
    }
  }

  const handleGlobalMouseUp = () => {
    setDraggingId(null)
    setResizingId(null)
    initialBoxState.current = null
  }
  // ... (End of logic) ...

  useEffect(() => {
    if (draggingId || resizingId) {
      window.addEventListener('mousemove', handleGlobalMouseMove)
      window.addEventListener('mouseup', handleGlobalMouseUp)
      ipcRenderer.send('set-ignore-mouse-events', false)
    } else {
      window.removeEventListener('mousemove', handleGlobalMouseMove)
      window.removeEventListener('mouseup', handleGlobalMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove)
      window.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [draggingId, resizingId])

  const addBox = (preset: Preset) => {
    setBoxes(prev => [...prev, {
      id: Date.now().toString(),
      x: window.innerWidth / 2 - preset.width / 2,
      y: window.innerHeight / 2 - preset.height / 2,
      width: preset.width,
      height: preset.height,
      label: preset.label,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    }])
  }

  const updateBox = (id: string, updates: Partial<BoundingBox>) => {
    setBoxes(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b))
  }

  const removeBox = (id: string) => {
    setBoxes(prev => prev.filter(b => b.id !== id))
    if (boxes.length <= 1) onClose()
  }

  if (hidden) {
      return (
          <div className="fixed top-4 left-4 z-50 interactive-zone">
              <button 
                onClick={() => setHidden(false)}
                className="bg-zinc-800 text-white p-3 rounded-xl shadow-lg hover:bg-zinc-700 border border-zinc-600 flex items-center gap-2 font-medium"
              >
                  <Layout className="w-5 h-5" />
                  Show Guides
              </button>
          </div>
      )
  }

  return (
    <div 
        ref={containerRef}
        className="w-screen h-screen relative overflow-hidden"
        onMouseMove={handleMouseMove}
    >
        {/* Main Toolbar */}
        <Toolbar onClose={onClose} className="top-4 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-2 px-2">
                <span className="text-zinc-400 text-sm font-medium mr-2 hidden md:inline">Presets:</span>
                {DEFAULT_PRESETS.map(preset => (
                    <button 
                        key={preset.id} 
                        onClick={() => addBox(preset)} 
                        className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                        title={`Add ${preset.label}`}
                    >
                        <span className="text-xs font-mono border border-zinc-600 rounded px-1.5 py-0.5">{preset.width}x{preset.height}</span>
                    </button>
                ))}
                <div className="w-px bg-white/10 mx-1 h-6"></div>
                <button 
                    onClick={() => setHidden(true)} 
                    className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-yellow-400 transition-colors" 
                    title="Hide (Redact)"
                >
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
            borderColor: box.color
          }}
          className="absolute border-2 pointer-events-none group"
        >
            {/* Top Bar / Handle */}
            <div 
                className="absolute -top-10 left-0 min-w-[200px] h-10 flex items-center gap-2 px-3 bg-zinc-900/90 backdrop-blur rounded-t-xl interactive-zone pointer-events-auto cursor-move border-x border-t border-white/10 shadow-xl transition-opacity opacity-0 group-hover:opacity-100"
                style={{ borderColor: box.color }}
                onMouseDown={(e) => handleMouseDown(e, box.id, 'move')}
            >
                {/* Color Picker */}
                <div className="flex gap-1">
                    {COLORS.map(c => (
                        <button
                            key={c}
                            onClick={(e) => { e.stopPropagation(); updateBox(box.id, { color: c }) }}
                            className={`w-3 h-3 rounded-full ${box.color === c ? 'ring-2 ring-white scale-110' : 'hover:scale-110'}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>

                <div className="w-px bg-white/10 h-4 mx-1"></div>

                {/* Dimensions Input */}
                <div className="flex gap-1 items-center text-xs font-mono text-zinc-400">
                    <input 
                        type="number" 
                        value={Math.round(box.width)} 
                        onChange={(e) => updateBox(box.id, { width: parseInt(e.target.value) || 100 })}
                        className="w-10 bg-transparent text-right focus:text-white outline-none border-b border-transparent focus:border-white/20"
                        onMouseDown={(e) => e.stopPropagation()}
                    />
                    <span>x</span>
                    <input 
                        type="number" 
                        value={Math.round(box.height)} 
                        onChange={(e) => updateBox(box.id, { height: parseInt(e.target.value) || 100 })}
                        className="w-10 bg-transparent focus:text-white outline-none border-b border-transparent focus:border-white/20"
                        onMouseDown={(e) => e.stopPropagation()}
                    />
                </div>

                <div className="flex-1"></div>

                <button 
                    onClick={(e) => { e.stopPropagation(); removeBox(box.id) }} 
                    className="p-1 hover:text-red-400 text-zinc-500 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Resize Handle (Bottom Right) */}
            <div 
                className="absolute -bottom-3 -right-3 w-6 h-6 bg-white/20 rounded-full interactive-zone pointer-events-auto cursor-nwse-resize flex items-center justify-center hover:bg-white/40 backdrop-blur border border-white/10"
                onMouseDown={(e) => handleMouseDown(e, box.id, 'resize')}
            >
                <div className="w-2 h-2 bg-white rounded-full" />
            </div>

            {/* Visual Border */}
            <div className={`absolute inset-0 border-2 pointer-events-none`} style={{ borderColor: box.color }}></div>
        </div>
      ))}
    </div>
  )
}

export default BoundingBoxTool
