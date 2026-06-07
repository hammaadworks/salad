import { useState, useRef, useEffect, useCallback } from 'react'
import { ipcRenderer } from 'electron'
import {
  Camera,
  Scroll,
  Video,
  Square,
  Circle,
  MoveUpRight,
  PenTool,
  Undo,
  Check,
  Droplet,
  Trash2
} from 'lucide-react'
import { cn } from '../../utils'

interface CaptureToolProps {
  onClose: () => void
}

type Mode = 'select' | 'rect' | 'circle' | 'arrow' | 'pen' | 'text' | 'blur';
type CaptureType = 'image' | 'video' | 'scroll';

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

const COLORS = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'White', value: '#ffffff' },
  { name: 'Black', value: '#000000' }
]

export default function CaptureTool({ onClose }: CaptureToolProps) {
  // Main State
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  const [selection, setSelection] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [mode, setMode] = useState<Mode>('select')
  const [captureType, setCaptureType] = useState<CaptureType>('image')
  const [activeColor, setActiveColor] = useState(COLORS[3].value) // Default Blue
  
  // Interaction State
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState<string | null>(null)
  const [isMoving, setIsMoving] = useState(false)
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null)
  
  // Annotation State
  const [shapes, setShapes] = useState<Shape[]>([])
  const [redoStack, setRedoStack] = useState<Shape[][]>([])
  const [currentShape, setCurrentShape] = useState<Shape | null>(null)
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [recordingTime] = useState(0)
  
  // Scrolling State
  const isScrollingMode = false;
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const videoPreviewRef = useRef<HTMLVideoElement>(null)

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
    return () => { 
        ipcRenderer.send('set-fullscreen', false)
        ipcRenderer.send('set-ignore-mouse-events', false)
    }
  }, [captureInitialScreen])

  // Canvas Drawing Logic
  const drawShape = useCallback((ctx: CanvasRenderingContext2D, shape: Shape) => {
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    
    if (shape.type === 'blur') {
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'
      ctx.lineWidth = 20
      ctx.filter = 'blur(10px)'
    } else {
      ctx.strokeStyle = shape.color
      ctx.lineWidth = shape.strokeWidth
      ctx.filter = 'none'
    }

    if (shape.type === 'rect' && shape.width !== undefined && shape.height !== undefined) {
      ctx.strokeRect(shape.x!, shape.y!, shape.width, shape.height)
    } else if (shape.type === 'circle' && shape.width !== undefined && shape.height !== undefined) {
      ctx.beginPath()
      ctx.ellipse(shape.x! + shape.width/2, shape.y! + shape.height/2, Math.abs(shape.width/2), Math.abs(shape.height/2), 0, 0, Math.PI * 2)
      ctx.stroke()
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
    } else if ((shape.type === 'pen' || shape.type === 'blur') && shape.points) {
      ctx.beginPath()
      ctx.moveTo(shape.points[0].x, shape.points[0].y)
      shape.points.forEach(p => ctx.lineTo(p.x, p.y))
      ctx.stroke()
    }
    
    ctx.filter = 'none' // Reset
  }, [])

  useEffect(() => {
    if (!canvasRef.current || !selection) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    shapes.forEach(s => drawShape(ctx, s))
    if (currentShape) drawShape(ctx, currentShape)
  }, [shapes, currentShape, selection, drawShape])

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
      ipcRenderer.send('set-pill-mode', false)
      ipcRenderer.send('set-fullscreen', true)
      ipcRenderer.send('show-window-and-focus')
    }
  }

  // Mouse Event Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.toolbar')) return
    if (isRecording || videoUrl) return

    const x = e.clientX; 
    const y = e.clientY;
    
    if (mode === 'select') {
      const handle = (e.target as HTMLElement).getAttribute('data-handle')
      if (handle) { setIsResizing(handle); setStartPos({ x, y }); return; }
      if (selection && x >= selection.x && x <= selection.x + selection.width && y >= selection.y && y <= selection.y + selection.height) {
        setIsMoving(true); setStartPos({ x, y }); return;
      }
      setIsDragging(true); setStartPos({ x, y }); setSelection({ x, y, width: 0, height: 0 });
    } else {
      setIsDragging(true); setStartPos({ x, y });
      setCurrentShape({ 
        type: mode, x, y, width: 0, height: 0, 
        points: (mode === 'pen' || mode === 'blur') ? [{ x, y }] : undefined, 
        color: activeColor, 
        strokeWidth: mode === 'blur' ? 20 : 3 
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const x = e.clientX; 
    const y = e.clientY; 
    
    if (isResizing && selection && startPos) {
      const dx = x - startPos.x; const dy = y - startPos.y; 
      let { x: sx, y: sy, width: sw, height: sh } = selection;
      if (isResizing.includes('right')) sw += dx;
      if (isResizing.includes('left')) { sx += dx; sw -= dx };
      if (isResizing.includes('bottom')) sh += dy;
      if (isResizing.includes('top')) { sy += dy; sh -= dy };
      setSelection({ x: sx, y: sy, width: sw, height: sh }); setStartPos({ x, y });
    } else if (isMoving && selection && startPos) {
      const dx = x - startPos.x; const dy = y - startPos.y; 
      setSelection({ ...selection, x: selection.x + dx, y: selection.y + dy }); setStartPos({ x, y });
    } else if (isDragging && startPos) {
      if (mode === 'select') {
        setSelection({ x: Math.min(startPos.x, x), y: Math.min(startPos.y, y), width: Math.abs(x - startPos.x), height: Math.abs(y - startPos.y) })
      } else if (currentShape) {
        if (mode === 'pen' || mode === 'blur') { 
            setCurrentShape({ ...currentShape, points: [...(currentShape.points || []), { x, y }] }) 
        } else { 
            setCurrentShape({ ...currentShape, width: x - startPos.x, height: y - startPos.y }) 
        }
      }
    }
  }

  const handleMouseUp = () => {
    if (currentShape) { setShapes([...shapes, currentShape]); setCurrentShape(null); setRedoStack([]); }
    setIsDragging(false); setIsResizing(null); setIsMoving(false); setStartPos(null);
  }

  const handleUndo = () => {
    if (shapes.length === 0) return
    const newShapes = [...shapes]
    const removed = newShapes.pop()
    if (removed) setRedoStack([[removed], ...redoStack])
    setShapes(newShapes)
  }

  // Final Action Handlers
  const getProcessedCanvas = async (customSelection = selection) => {
    if (!customSelection || !screenshotUrl) return null;
    return new Promise<HTMLCanvasElement>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scaleX = img.naturalWidth / window.innerWidth;
        const scaleY = img.naturalHeight / window.innerHeight;
        canvas.width = Math.abs(customSelection.width * scaleX);
        canvas.height = Math.abs(customSelection.height * scaleY);
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, customSelection.x * scaleX, customSelection.y * scaleY, customSelection.width * scaleX, customSelection.height * scaleY, 0, 0, canvas.width, canvas.height);
            
            ctx.save(); 
            ctx.scale(scaleX, scaleY); 
            ctx.translate(-customSelection.x, -customSelection.y);
            
            // Draw all shapes and blurs
            shapes.forEach(s => {
                if (s.type === 'blur' && s.points) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(s.points[0].x, s.points[0].y);
                    s.points.forEach(p => ctx.lineTo(p.x, p.y));
                    ctx.lineWidth = 40;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.clip();
                    ctx.filter = 'blur(15px)';
                    ctx.drawImage(img, 0, 0, window.innerWidth, window.innerHeight);
                    ctx.restore();
                } else {
                    drawShape(ctx, s);
                }
            });
            ctx.restore();
            resolve(canvas);
        }
      };
      img.src = screenshotUrl;
    });
  }

  const handleSaveImage = async (custom: boolean = false) => {
    const canvas = await getProcessedCanvas();
    if (canvas) {
        ipcRenderer.send('save-image', { dataUrl: canvas.toDataURL('image/png'), custom });
        onClose();
    }
  }

  return (
    <div className={cn("fixed inset-0 z-50 select-none overflow-hidden flex flex-col", isRecording ? "bg-transparent" : "bg-black/80")}>
      {!isRecording && !videoUrl && screenshotUrl && (
          <img src={screenshotUrl} className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-40" alt="" />
      )}

      <div 
        className={cn("relative flex-1", !isRecording && !videoUrl && "cursor-crosshair")}
        onMouseDown={handleMouseDown} 
        onMouseMove={handleMouseMove} 
        onMouseUp={handleMouseUp}
      >
        {selection && !isRecording && !videoUrl && (
            <div 
                className="absolute border-2 border-blue-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]"
                style={{ left: selection.x, top: selection.y, width: selection.width, height: selection.height }}
            >
                {!isScrollingMode && <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} className="fixed inset-0 pointer-events-none" />}
                
                {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(h => (
                    <div key={h} data-handle={h} className="absolute w-3 h-3 bg-blue-500 border border-white -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize" style={{ top: h.includes('top') ? 0 : '100%', left: h.includes('left') ? 0 : '100%' }} />
                ))}
            </div>
        )}

        {videoUrl && (
            <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center p-12">
                <div className="relative max-w-4xl w-full aspect-video bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                    <video ref={videoPreviewRef} src={videoUrl} controls className="w-full h-full" />
                </div>
                <div className="flex items-center gap-4 mt-12">
                    <button onClick={() => setVideoUrl(null)} className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all">Discard</button>
                    <button onClick={() => ipcRenderer.send('save-video', { dataUrl: videoUrl })} className="px-12 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold shadow-xl shadow-blue-600/20 transition-all">Save Recording</button>
                </div>
            </div>
        )}
      </div>

      {/* Main Mode Toolbar */}
      {!isRecording && !videoUrl && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-[100]">
              <div className="bg-zinc-900/90 backdrop-blur-2xl border border-white/10 p-1.5 rounded-2xl shadow-2xl flex items-center gap-1">
                  <ModeTab icon={Camera} active={captureType === 'image'} onClick={() => setCaptureType('image')} label="Image" />
                  <ModeTab icon={Video} active={captureType === 'video'} onClick={() => setCaptureType('video')} label="Video" />
                  <ModeTab icon={Scroll} active={captureType === 'scroll'} onClick={() => setCaptureType('scroll')} label="Scrolling" />
              </div>

              {selection && (
                  <div className="toolbar flex items-center gap-4 bg-zinc-900/90 backdrop-blur-2xl border border-white/10 p-2 rounded-2xl shadow-2xl animate-in zoom-in duration-300">
                      <div className="flex items-center gap-1 px-1 border-r border-white/5">
                        <IconButton icon={Square} active={mode === 'rect'} onClick={() => setMode('rect')} title="Box" />
                        <IconButton icon={Circle} active={mode === 'circle'} onClick={() => setMode('circle')} title="Circle" />
                        <IconButton icon={MoveUpRight} active={mode === 'arrow'} onClick={() => setMode('arrow')} title="Arrow" />
                        <IconButton icon={PenTool} active={mode === 'pen'} onClick={() => setMode('pen')} title="Draw" />
                        <IconButton icon={Droplet} active={mode === 'blur'} onClick={() => setMode('blur')} title="Censor/Blur" />
                      </div>

                      <div className="flex items-center gap-2 px-1 border-r border-white/5">
                        {COLORS.map(c => (
                            <button 
                                key={c.name}
                                onClick={() => setActiveColor(c.value)}
                                className={cn(
                                    "w-6 h-6 rounded-full border-2 transition-all transform hover:scale-110",
                                    activeColor === c.value ? "border-white scale-125" : "border-transparent"
                                )}
                                style={{ backgroundColor: c.value }}
                                title={c.name}
                            />
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <IconButton icon={Undo} onClick={handleUndo} title="Undo" />
                        <button 
                            onClick={() => handleSaveImage()}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all"
                        >
                            <Check className="w-4 h-4" /> Finish
                        </button>
                        <button onClick={() => setSelection(null)} className="p-2 text-zinc-500 hover:text-white transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                  </div>
              )}
          </div>
      )}

      {/* Recording UI */}
      {isRecording && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-zinc-950 border border-red-500/30 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-2xl z-[200]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-widest">Recording • 00:{recordingTime.toString().padStart(2, '0')}</span>
              </div>
              <button onClick={stopRecording} className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all active:scale-95 shadow-lg shadow-red-500/20">
                <Square className="w-4 h-4 fill-current" />
              </button>
          </div>
      )}
    </div>
  )
}

function ModeTab({ icon: Icon, active, onClick, label }: { icon: any, active: boolean, onClick: () => void, label: string }) {
    return (
        <button 
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 px-6 py-2.5 rounded-xl transition-all duration-300",
                active ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
            )}
        >
            <Icon className={cn("w-4 h-4", active ? "text-blue-600" : "")} />
            <span className="text-xs font-bold tracking-tight uppercase tracking-widest">{label}</span>
        </button>
    )
}

function IconButton({ icon: Icon, active, onClick, title }: { icon: any, active?: boolean, onClick: () => void, title: string }) {
    return (
        <button 
            onClick={onClick}
            title={title}
            className={cn(
                "p-2.5 rounded-xl transition-all duration-200",
                active ? "bg-blue-600 text-white shadow-lg" : "text-zinc-400 hover:bg-white/5 hover:text-white"
            )}
        >
            <Icon className="w-5 h-5" />
        </button>
    )
}
