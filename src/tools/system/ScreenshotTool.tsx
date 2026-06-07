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
  Download,
  X,
  Check,
  Copy,
  Undo,
  Loader2,
  Plus
} from 'lucide-react'
import { createWorker } from 'tesseract.js'
import { cn } from '../../utils'

interface ScreenshotToolProps {
  onClose: () => void
}

type Mode = 'select' | 'rect' | 'circle' | 'arrow' | 'pen' | 'text' | 'eraser';

interface Shape {
  type: Mode;
  points?: { x: number; y: number }[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  text?: string;
  color: string;
  strokeWidth: number;
}

export default function ScreenshotTool({ onClose }: ScreenshotToolProps) {
  // State
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  const [selection, setSelection] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [mode, setMode] = useState<Mode>('select')
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState<string | null>(null)
  const [isMoving, setIsMoving] = useState(false)
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null)
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  
  const [shapes, setShapes] = useState<Shape[]>([])
  const [redoStack, setRedoStack] = useState<Shape[][]>([])
  const [currentShape, setCurrentShape] = useState<Shape | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingText, setProcessingText] = useState('Processing...')
  
  // Scrolling Screenshot State
  const [isScrollingMode, setIsScrollingMode] = useState(false)
  const [scrollingStrips, setScrollingStrips] = useState<string[]>([])
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialization
  const captureInitialScreen = useCallback(async () => {
    try {
      const url = await ipcRenderer.invoke('capture-screen')
      setScreenshotUrl(url)
      ipcRenderer.send('set-fullscreen', true)
    } catch (err) {
      console.error('Failed to capture screen:', err)
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    captureInitialScreen()
    return () => { ipcRenderer.send('set-fullscreen', false) }
  }, [captureInitialScreen])

  // Key handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isScrollingMode) {
          setIsScrollingMode(false);
          setScrollingStrips([]);
          return;
        }
        if (selection) { 
          setSelection(null); 
          setShapes([]); 
          setMode('select'); 
        } else {
          onClose();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') handleUndo();
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selection, onClose, shapes, isScrollingMode])

  // Canvas Drawing
  const drawOnCanvas = useCallback((ctx: CanvasRenderingContext2D, shape: Shape) => {
    ctx.strokeStyle = shape.color;
    ctx.fillStyle = shape.color;
    ctx.lineWidth = shape.strokeWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    if (shape.type === 'rect' && shape.width !== undefined && shape.height !== undefined) {
      ctx.strokeRect(shape.x!, shape.y!, shape.width, shape.height)
    } else if (shape.type === 'circle' && shape.width !== undefined && shape.height !== undefined) {
      ctx.beginPath();
      ctx.ellipse(
        shape.x! + shape.width/2, 
        shape.y! + shape.height/2, 
        Math.abs(shape.width/2), 
        Math.abs(shape.height/2), 
        0, 0, Math.PI * 2
      );
      ctx.stroke();
    } else if (shape.type === 'pen' && shape.points) {
      ctx.beginPath();
      ctx.moveTo(shape.points[0].x, shape.points[0].y);
      shape.points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    } else if (shape.type === 'arrow' && shape.width !== undefined && shape.height !== undefined) {
      const headlen = 15;
      const tox = shape.x! + shape.width;
      const toy = shape.y! + shape.height;
      const fromx = shape.x!;
      const fromy = shape.y!;
      const angle = Math.atan2(toy - fromy, tox - fromx);
      ctx.beginPath();
      ctx.moveTo(fromx, fromy);
      ctx.lineTo(tox, toy);
      ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(tox, toy);
      ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    }
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !selection) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    shapes.forEach(shape => drawOnCanvas(ctx, shape));
    if (currentShape) drawOnCanvas(ctx, currentShape);
  }, [shapes, currentShape, selection, drawOnCanvas])

  // Mouse Event Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.toolbar')) return
    if (isScrollingMode) return

    const x = e.clientX; 
    const y = e.clientY;
    
    if (mode === 'select') {
      const handle = (e.target as HTMLElement).getAttribute('data-handle')
      if (handle) { 
        setIsResizing(handle); 
        setStartPos({ x, y }); 
        return; 
      }
      if (selection && x >= selection.x && x <= selection.x + selection.width && y >= selection.y && y <= selection.y + selection.height) {
        setIsMoving(true); 
        setStartPos({ x, y }); 
        return;
      }
      setIsDragging(true); 
      setStartPos({ x, y }); 
      setSelection({ x, y, width: 0, height: 0 });
    } else {
      setIsDragging(true); 
      setStartPos({ x, y });
      setCurrentShape({ 
        type: mode, x, y, width: 0, height: 0, 
        points: mode === 'pen' ? [{ x, y }] : undefined, 
        color: '#14b8a6', 
        strokeWidth: 3 
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const x = e.clientX; 
    const y = e.clientY; 
    setMousePos({ x, y });
    
    if (isResizing && selection && startPos) {
      const dx = x - startPos.x; 
      const dy = y - startPos.y; 
      let { x: sx, y: sy, width: sw, height: sh } = selection;
      if (isResizing.includes('right')) sw += dx;
      if (isResizing.includes('left')) { sx += dx; sw -= dx };
      if (isResizing.includes('bottom')) sh += dy;
      if (isResizing.includes('top')) { sy += dy; sh -= dy };
      setSelection({ x: sx, y: sy, width: sw, height: sh }); 
      setStartPos({ x, y });
    } else if (isMoving && selection && startPos) {
      const dx = x - startPos.x; 
      const dy = y - startPos.y; 
      setSelection({ ...selection, x: selection.x + dx, y: selection.y + dy }); 
      setStartPos({ x, y });
    } else if (isDragging && startPos) {
      if (mode === 'select') {
        setSelection({ 
          x: Math.min(startPos.x, x), 
          y: Math.min(startPos.y, y), 
          width: Math.abs(x - startPos.x), 
          height: Math.abs(y - startPos.y) 
        })
      } else if (currentShape) {
        if (mode === 'pen') {
          setCurrentShape({ ...currentShape, points: [...(currentShape.points || []), { x, y }] })
        } else {
          setCurrentShape({ ...currentShape, width: x - startPos.x, height: y - startPos.y })
        }
      }
    }
  }

  const handleMouseUp = () => {
    if (currentShape) { 
      setShapes([...shapes, currentShape]); 
      setCurrentShape(null); 
      setRedoStack([]); 
    }
    setIsDragging(false); 
    setIsResizing(null); 
    setIsMoving(false); 
    setStartPos(null);
  }

  const handleUndo = () => {
    if (shapes.length === 0) return; 
    const newShapes = [...shapes]; 
    const removed = newShapes.pop();
    if (removed) setRedoStack([[removed], ...redoStack]); 
    setShapes(newShapes);
  }

  const getCroppedImage = useCallback(async (customSelection = selection) => {
    if (!customSelection || !screenshotUrl) return null;
    return new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas'); 
        const scaleX = img.naturalWidth / window.innerWidth; 
        const scaleY = img.naturalHeight / window.innerHeight;
        canvas.width = Math.abs(customSelection.width * scaleX); 
        canvas.height = Math.abs(customSelection.height * scaleY);
        
        const ctx = canvas.getContext('2d'); 
        if (!ctx) return reject('No context');
        
        ctx.drawImage(
          img, 
          customSelection.x * scaleX, customSelection.y * scaleY, customSelection.width * scaleX, customSelection.height * scaleY, 
          0, 0, canvas.width, canvas.height
        );
        
        // Only draw shapes if we are using the main selection
        if (customSelection === selection) {
          ctx.save();
          ctx.scale(scaleX, scaleY); 
          ctx.translate(-customSelection.x, -customSelection.y);
          shapes.forEach(shape => drawOnCanvas(ctx, shape));
          ctx.restore();
        }
        
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = screenshotUrl;
    });
  }, [selection, screenshotUrl, shapes, drawOnCanvas]);

  // Features
  const handleSave = async (custom: boolean = false) => {
    const dataUrl = await getCroppedImage();
    if (dataUrl) { 
      ipcRenderer.send('save-image', { dataUrl, custom }); 
      onClose(); 
    }
  }

  const handleCopy = async () => {
    const dataUrl = await getCroppedImage();
    if (dataUrl) { 
      ipcRenderer.send('copy-image', { dataUrl }); 
      onClose(); 
    }
  }

  const handleOCR = async () => {
    const dataUrl = await getCroppedImage();
    if (!dataUrl) return;
    
    setIsProcessing(true);
    setProcessingText('Running OCR...');
    try {
      const worker = await createWorker('eng');
      const ret = await worker.recognize(dataUrl);
      const text = ret.data.text;
      await worker.terminate();
      
      if (text) {
        ipcRenderer.send('copy-text', text);
        alert('OCR Complete: Text copied to clipboard');
      } else {
        alert('No text detected in selection.');
      }
      onClose();
    } catch (err) {
      console.error('OCR failed:', err);
      alert('OCR failed to process image. Make sure tesseract is loaded.');
    } finally {
      setIsProcessing(false);
    }
  }

  const handleScrollingScreenshot = async () => {
      if (!selection) {
          alert('Please select an area first');
          return;
      }
      setIsScrollingMode(true);
      setScrollingStrips([]);
      // Start with the first capture
      captureStrip();
  }

  const captureStrip = async () => {
      if (!selection) return;
      
      setIsProcessing(true);
      setProcessingText('Capturing strip...');
      
      try {
          // 1. Hide overlay to capture the actual content
          ipcRenderer.send('set-fullscreen', false);
          await new Promise(r => setTimeout(r, 100)); // Wait for window to hide
          
          // 2. Capture fresh screen
          const url = await ipcRenderer.invoke('capture-screen');
          
          // 3. Extract the strip from the fresh capture
          const img = new Image();
          await new Promise((res) => { img.onload = res; img.src = url; });
          
          const canvas = document.createElement('canvas');
          const scaleX = img.naturalWidth / window.innerWidth;
          const scaleY = img.naturalHeight / window.innerHeight;
          canvas.width = Math.abs(selection.width * scaleX);
          canvas.height = Math.abs(selection.height * scaleY);
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
              ctx.drawImage(
                  img, 
                  selection.x * scaleX, selection.y * scaleY, selection.width * scaleX, selection.height * scaleY, 
                  0, 0, canvas.width, canvas.height
              );
              const stripData = canvas.toDataURL('image/png');
              setScrollingStrips(prev => [...prev, stripData]);
          }
          
          // 4. Show overlay again
          ipcRenderer.send('set-fullscreen', true);
          setScreenshotUrl(url); // Update base image
          
      } catch (err) {
          console.error('Failed to capture strip:', err);
      } finally {
          setIsProcessing(false);
      }
  }

  const finishScrolling = async () => {
      if (scrollingStrips.length === 0) {
          setIsScrollingMode(false);
          return;
      }
      
      setIsProcessing(true);
      setProcessingText('Stitching strips...');
      
      try {
          const images = await Promise.all(scrollingStrips.map(src => {
              return new Promise<HTMLImageElement>((res) => {
                  const img = new Image();
                  img.onload = () => res(img);
                  img.src = src;
              });
          }));
          
          const totalHeight = images.reduce((acc, img) => acc + img.height, 0);
          const width = images[0].width;
          
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = totalHeight;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
              let currentY = 0;
              images.forEach(img => {
                  ctx.drawImage(img, 0, currentY);
                  currentY += img.height;
              });
              
              const finalDataUrl = canvas.toDataURL('image/png');
              ipcRenderer.send('save-image', { dataUrl: finalDataUrl, custom: true });
              onClose();
          }
      } catch (err) {
          console.error('Failed to stitch images:', err);
      } finally {
          setIsProcessing(false);
          setIsScrollingMode(false);
          setScrollingStrips([]);
      }
  }

  const handleRecord = () => {
      ipcRenderer.send('switch-tab', 'record');
      // DO NOT call onClose() here, the tab switch will unmount this component
  }

  return (
    <div 
        ref={containerRef} 
        data-testid="screenshot-container"
        className={cn(
            "fixed inset-0 z-50 select-none bg-black overflow-hidden",
            isScrollingMode ? "cursor-default" : (mode === 'select' ? (isMoving ? 'grabbing' : 'crosshair') : 'crosshair')
        )}
        onMouseDown={handleMouseDown} 
        onMouseMove={handleMouseMove} 
        onMouseUp={handleMouseUp} 
    >
      {screenshotUrl && <img src={screenshotUrl} className="absolute inset-0 w-full h-full object-cover pointer-events-none" alt="" />}
      
      {!isScrollingMode && isDragging && !selection && (
        <div className="fixed pointer-events-none border-2 border-white rounded-full overflow-hidden shadow-2xl z-[60]" style={{ left: mousePos.x + 20, top: mousePos.y + 20, width: 120, height: 120 }}>
          <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-px h-full bg-teal-500/50 absolute" />
              <div className="h-px w-full bg-teal-500/50 absolute" />
          </div>
          <img 
            src={screenshotUrl || ''} 
            className="absolute" 
            style={{ width: window.innerWidth * 3, height: window.innerHeight * 3, left: -mousePos.x * 3 + 60, top: -mousePos.y * 3 + 60 }} 
            alt="" 
          />
        </div>
      )}

      {/* Dark Overlay with cut-out */}
      <div 
        className="absolute inset-0 bg-black/40" 
        style={{ 
            clipPath: selection ? `polygon(0% 0%, 0% 100%, ${selection.x}px 100%, ${selection.x}px ${selection.y}px, ${selection.x + selection.width}px ${selection.y}px, ${selection.x + selection.width}px ${selection.y + selection.height}px, ${selection.x}px ${selection.y + selection.height}px, ${selection.x}px 100%, 100% 100%, 100% 0%)` : 'none' 
        }} 
      />

      {selection && (
        <div className={cn("absolute border border-blue-500", isScrollingMode && "border-white border-dashed bg-white/5 animate-pulse")} style={{ left: selection.x, top: selection.y, width: selection.width, height: selection.height }}>
          {!isScrollingMode && <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} className="fixed inset-0 pointer-events-none" />}
          
          {!isScrollingMode && ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top', 'bottom', 'left', 'right'].map(h => (
            <div 
                key={h} 
                data-handle={h} 
                className={cn(
                    "absolute w-2.5 h-2.5 bg-blue-500 border border-white/20 rounded-sm z-10",
                    h.includes('top') ? '-top-1.25' : h.includes('bottom') ? '-bottom-1.25' : 'top-1/2 -translate-y-1/2',
                    h.includes('left') ? '-left-1.25' : h.includes('right') ? '-right-1.25' : 'left-1/2 -translate-x-1/2'
                )} 
                style={{ cursor: h.includes('top-left') || h.includes('bottom-right') ? 'nwse-resize' : h.includes('top-right') || h.includes('bottom-left') ? 'nesw-resize' : h.includes('top') || h.includes('bottom') ? 'ns-resize' : 'ew-resize' }} 
            />
          ))}
          <div className="absolute -top-6 left-0 bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-bold shadow-lg">
              {Math.round(Math.abs(selection.width))} × {Math.round(Math.abs(selection.height))}
          </div>
        </div>
      )}

      {/* Scrolling UI */}
      {isScrollingMode && (
          <div className="fixed top-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-[80]">
              <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 w-[280px]">
                  <div className="flex flex-col items-center text-center">
                    <h3 className="text-white font-bold text-sm tracking-tight">Scrolling Capture</h3>
                    <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1">Strips: <span className="text-blue-400 font-bold">{scrollingStrips.length}</span></p>
                  </div>
                  
                  <div className="text-zinc-400 text-[11px] text-center leading-relaxed">
                      Scroll down and capture next strip.
                  </div>

                  <div className="flex flex-col gap-2 w-full mt-2">
                      <button 
                        onClick={captureStrip}
                        disabled={isProcessing}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-black font-bold text-xs rounded-lg hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-50"
                      >
                          <Plus className="w-3.5 h-3.5" /> Capture Next
                      </button>
                      <button 
                        onClick={finishScrolling}
                        disabled={isProcessing || scrollingStrips.length === 0}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-500 transition-all active:scale-95 disabled:opacity-50"
                      >
                          <Check className="w-3.5 h-3.5" /> Finish & Stitch
                      </button>
                  </div>
              </div>
              <button 
                onClick={() => { setIsScrollingMode(false); setScrollingStrips([]); }}
                className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-white/5 transition-all"
              >
                  Cancel
              </button>
          </div>
      )}

      {/* Top Main Mode Toolbar */}
      {!isScrollingMode && (
          <div className="toolbar fixed top-6 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-zinc-900 border border-white/10 p-1 rounded-xl shadow-2xl z-[70]">
            <ToolButton icon={Camera} active label="Capture" /> 
            <ToolButton icon={Scroll} onClick={handleScrollingScreenshot} label="Scrolling" /> 
            <ToolButton icon={Video} onClick={handleRecord} label="Record" /> 
            <ToolButton icon={Type} onClick={() => { if (selection) handleOCR(); else alert('Select an area first'); }} label="OCR" />
          </div>
      )}

      {/* Drawing & Actions Toolbar */}
      {!isScrollingMode && selection && (
        <div 
            data-testid="actions-toolbar"
            className="toolbar fixed flex items-center gap-1 bg-zinc-900 p-1.5 rounded-xl shadow-2xl border border-white/10 z-[70]" 
            style={{ 
                top: Math.min(window.innerHeight - 80, selection.y + selection.height + 16), 
                left: Math.max(16, Math.min(window.innerWidth - 460, selection.x + selection.width/2 - 230)) 
            }}
        >
            <IconButton icon={Square} active={mode === 'rect'} onClick={() => setMode('rect')} title="Rectangle" />
            <IconButton icon={Circle} active={mode === 'circle'} onClick={() => setMode('circle')} title="Circle" />
            <IconButton icon={MoveUpRight} active={mode === 'arrow'} onClick={() => setMode('arrow')} title="Arrow" />
            <IconButton icon={PenTool} active={mode === 'pen'} onClick={() => setMode('pen')} title="Pen" />
            
            <div className="w-px h-5 bg-white/10 mx-1" />
            
            <IconButton icon={Undo} onClick={handleUndo} title="Undo (Cmd+Z)" />
            
            <div className="w-px h-5 bg-white/10 mx-1" />
            
            <IconButton icon={Type} onClick={handleOCR} title="OCR - Extract Text" />
            <IconButton icon={Download} onClick={() => handleSave(true)} title="Save As..." />
            <IconButton icon={Copy} onClick={handleCopy} title="Copy to Clipboard" />
            
            <button 
                onClick={() => handleSave(false)} 
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white font-bold text-[11px] rounded-lg hover:bg-blue-500 transition-all active:scale-95 ml-2 shadow-lg shadow-blue-600/20"
                title="Quick Save"
            >
                <Check className="w-3.5 h-3.5" /> Save
            </button>
            
            <button 
                onClick={() => setSelection(null)} 
                className="p-1.5 text-zinc-500 hover:text-white transition-colors"
                title="Cancel Selection"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
      )}

      {/* Processing Loader */}
      {isProcessing && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center animate-fade-in">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
              <div className="text-white font-bold uppercase tracking-widest text-xs">{processingText}</div>
          </div>
      )}
    </div>
  )
}

function ToolButton({ icon: Icon, active, onClick, label }: { icon: any, active?: boolean, onClick?: () => void, label: string }) {
  return (
    <button 
        onClick={onClick}
        className={cn(
            "group relative flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200",
            active ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'
        )}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="text-[11px] font-semibold tracking-tight">{label}</span>
      {active && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-blue-500 rounded-full" />}
    </button>
  )
}

function IconButton({ icon: Icon, onClick, className, active, title }: { icon: any, onClick?: () => void, className?: string, active?: boolean, title?: string }) {
    return (
        <button 
            onClick={onClick} 
            title={title} 
            className={cn(
                "p-2 rounded-lg transition-all active:scale-90",
                active ? 'bg-blue-500/10 text-blue-400' : 'hover:bg-white/5 text-zinc-500 hover:text-zinc-200',
                className
            )}
        >
            <Icon className="w-4 h-4" />
        </button>
    )
}
