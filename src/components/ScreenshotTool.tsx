import React, { useState, useRef, useEffect, useCallback } from 'react'
import { ipcRenderer } from 'electron'
import {
  Camera,
  Scroll,
  Video,
  Type,
  Square,
  Circle,
  MoveUpRight,
  PenTool,
  Type as TextIcon,
  Eraser,
  Download,
  X,
  Check,
  Crop,
  Copy,
  Undo,
  Redo
} from 'lucide-react'

interface ScreenshotToolProps {
  onClose: () => void
}

export default function ScreenshotTool({ onClose }: ScreenshotToolProps) {
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  const [selection, setSelection] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null)
  
  // Fake dimensions for the "size" display
  const displaySize = selection ? `${Math.round(selection.width)} x ${Math.round(selection.height)}` : ''

  const containerRef = useRef<HTMLDivElement>(null)

  // Capture screen on mount
  useEffect(() => {
    const init = async () => {
      try {
        const url = await ipcRenderer.invoke('capture-screen')
        setScreenshotUrl(url)
        // Only trigger fullscreen after we have the image to avoid flashing black
        ipcRenderer.send('set-fullscreen', true)
      } catch (err) {
        console.error('Failed to capture screen:', err)
        onClose()
      }
    }
    init()

    return () => {
      ipcRenderer.send('set-fullscreen', false)
    }
  }, [])

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selection) {
          setSelection(null)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selection, onClose])


  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start selection if clicking on the overlay (not the toolbars)
    if ((e.target as HTMLElement).closest('.toolbar')) return

    setIsDragging(true)
    setStartPos({ x: e.clientX, y: e.clientY })
    setSelection({ x: e.clientX, y: e.clientY, width: 0, height: 0 })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !startPos) return

    const currentX = e.clientX
    const currentY = e.clientY

    setSelection({
      x: Math.min(startPos.x, currentX),
      y: Math.min(startPos.y, currentY),
      width: Math.abs(currentX - startPos.x),
      height: Math.abs(currentY - startPos.y)
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setStartPos(null)
  }

  const getCroppedImage = useCallback(async () => {
    if (!selection || !screenshotUrl) return null;

    return new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Calculate scale factor (Physical pixels vs CSS pixels)
        // Use window.screen.width/height or innerWidth/Height?
        // Since the screenshot is full screen, and our overlay is full screen:
        const scaleX = img.naturalWidth / window.innerWidth;
        const scaleY = img.naturalHeight / window.innerHeight;

        // Set canvas size to the *physical* size of the selection for max quality
        canvas.width = selection.width * scaleX;
        canvas.height = selection.height * scaleY;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject('No context');
          return;
        }

        ctx.drawImage(
          img,
          selection.x * scaleX, selection.y * scaleY, selection.width * scaleX, selection.height * scaleY, // Source
          0, 0, canvas.width, canvas.height // Destination
        );

        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = screenshotUrl;
    });
  }, [selection, screenshotUrl]);

  const handleSave = async () => {
    if (!selection) return;
    try {
      const dataUrl = await getCroppedImage();
      if (dataUrl) {
          ipcRenderer.send('save-image', { dataUrl });
          onClose();
      }
    } catch (e) {
      console.error('Failed to crop image', e);
    }
  }

  const handleCopy = async () => {
    if (!selection) return;
    try {
      const dataUrl = await getCroppedImage();
      if (dataUrl) {
          ipcRenderer.send('copy-image', { dataUrl });
          onClose();
      }
    } catch (e) {
      console.error('Failed to copy image', e);
    }
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 cursor-crosshair select-none bg-black" // bg-black backing
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* 1. Captured Screen Background */}
      {screenshotUrl && (
        <img 
          src={screenshotUrl} 
          className="absolute inset-0 w-full h-full object-cover pointer-events-none" 
          alt="Screen Capture"
        />
      )}

      {/* 2. Dimming Overlay (Only if NO selection) */}
      {!selection && (
        <div className="absolute inset-0 bg-black/50" />
      )}

      {/* 3. Selection Box (With shadow dimmer) */}
      {selection && (
        <div
          className="absolute border-2 border-blue-500 bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
          style={{
            left: selection.x,
            top: selection.y,
            width: selection.width,
            height: selection.height,
          }}
        >
          {/* Resize Handles (Visual only for now) */}
          <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-blue-500 rounded-full" />
          <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-full" />
          <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-blue-500 rounded-full" />
          <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-full" />

          {/* Size Label */}
          <div className="absolute -top-8 left-0 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
            {displaySize}
          </div>
        </div>
      )}

      {/* Top Menu - Mode Switcher */}
      <div className="toolbar fixed top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-zinc-900/90 backdrop-blur-md p-1 rounded-lg border border-white/10 shadow-2xl z-50">
        <ToolButton icon={Camera} label="Screenshot" active />
        <ToolButton icon={Scroll} label="Scrollshot" />
        <ToolButton icon={Video} label="Record Screen" />
        <ToolButton icon={Type} label="Image to text" />
      </div>

      {/* Bottom Menu - Editor Tools (Only show if selection exists) */}
      {selection && (
        <div 
            className="toolbar fixed flex items-center gap-2 bg-white text-zinc-800 p-2 rounded-lg shadow-2xl z-50 border border-zinc-200"
            style={{
                top: selection.y + selection.height + 16,
                left: Math.max(16, Math.min(window.innerWidth - 600, selection.x + (selection.width / 2) - 300)) // Centered relative to selection, clamped
            }}
        >
            <div className="flex items-center gap-1 border-r border-zinc-200 pr-2">
                <IconButton icon={Square} />
                <IconButton icon={Circle} />
                <IconButton icon={PenTool} />
                <IconButton icon={MoveUpRight} />
                <IconButton icon={TextIcon} />
                <IconButton icon={Eraser} />
            </div>
            
            <div className="flex items-center gap-1 border-r border-zinc-200 pr-2 pl-2">
                <IconButton icon={Crop} />
                <IconButton icon={Undo} />
                <IconButton icon={Redo} />
            </div>

             <div className="flex items-center gap-1 pl-2">
                <IconButton icon={Download} onClick={handleSave} />
                <IconButton icon={Copy} onClick={handleCopy} />
                <div className="w-px h-6 bg-zinc-200 mx-1" />
                <IconButton icon={X} onClick={() => setSelection(null)} className="text-red-500 hover:bg-red-50" />
                <IconButton icon={Check} onClick={handleSave} className="text-green-500 hover:bg-green-50" />
            </div>
        </div>
      )}
      
      {/* Help text if no selection */}
      {!selection && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-white/50">
          <p>Drag to select an area</p>
        </div>
      )}
    </div>
  )
}

function ToolButton({ icon: Icon, label, active }: { icon: any, label: string, active?: boolean }) {
  return (
    <button className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${active ? 'bg-white text-black' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
      <Icon className="w-4 h-4" />
      {label}
    </button>
  )
}

function IconButton({ icon: Icon, onClick, className }: { icon: any, onClick?: () => void, className?: string }) {
    return (
        <button 
            onClick={onClick}
            className={`p-2 rounded hover:bg-zinc-100 text-zinc-600 transition-colors ${className || ''}`}
        >
            <Icon className="w-5 h-5" />
        </button>
    )
}