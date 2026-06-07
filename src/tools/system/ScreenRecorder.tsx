import { useState, useRef, useEffect } from 'react'
import { ipcRenderer } from 'electron'
import { Play, Square, Download, X, Video, Loader2 } from 'lucide-react'
import Toolbar from '../../components/Toolbar'
import { cn } from '../../utils'

interface ScreenRecorderProps {
  onClose: () => void
}

export default function ScreenRecorder({ onClose }: ScreenRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([])
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isPreparing, setIsPreparing] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      stopTimer()
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      ipcRenderer.send('set-pill-mode', false)
    }
  }, [])

  const startTimer = () => {
    setRecordingTime(0)
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1)
    }, 1000)
  }

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startRecording = async () => {
    setIsPreparing(true)
    try {
      const sourceId = await ipcRenderer.invoke('get-desktop-source-id')
      if (!sourceId) throw new Error('Could not find screen source ID')

      const stream = await (navigator.mediaDevices as any).getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sourceId,
            minWidth: 1280,
            maxWidth: 4000,
            minHeight: 720,
            maxHeight: 4000
          }
        }
      })

      const options = { mimeType: 'video/webm; codecs=vp9' }
      const mediaRecorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = mediaRecorder
      
      const chunks: Blob[] = []
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        setRecordedChunks(chunks)
        setVideoUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      startTimer()
      ipcRenderer.send('set-pill-mode', true)
    } catch (err) {
      console.error('Error starting recording:', err)
      alert('Failed to start recording.')
    } finally {
      setIsPreparing(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      stopTimer()
      ipcRenderer.send('set-pill-mode', false)
      ipcRenderer.send('show-window-and-focus')
    }
  }

  const handleSave = async () => {
    if (recordedChunks.length === 0) return
    const blob = new Blob(recordedChunks, { type: 'video/webm' })
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      ipcRenderer.send('save-video', { dataUrl })
    }
    reader.readAsDataURL(blob)
  }

  return (
    <div className={cn(
        "fixed inset-0 z-50 flex items-center justify-center pointer-events-none",
        isRecording && "bg-transparent"
    )}>
      <Toolbar 
        onClose={isRecording ? undefined : onClose} 
        className={cn(
            "pointer-events-auto shadow-2xl transition-all duration-300",
            isRecording ? "bg-zinc-950 border-red-500/20" : "bg-zinc-900 border-white/10"
        )}
      >
        <div className="flex items-center gap-4 px-3 py-1.5">
          {isRecording ? (
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping absolute inset-0" />
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full relative" />
              </div>
              <span className="text-xs font-mono font-bold text-white w-10">{formatTime(recordingTime)}</span>
              <button 
                onClick={stopRecording}
                className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all active:scale-95 shadow-lg shadow-red-500/20"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
          ) : videoUrl ? (
            <>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                    <Video className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-bold text-zinc-100 uppercase tracking-widest">Captured</span>
              </div>
              <div className="w-px h-5 bg-white/10 mx-1" />
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-600/20"
              >
                <Download className="w-3 h-3" /> Save Recording
              </button>
              <button 
                onClick={() => { setVideoUrl(null); setRecordedChunks([]); setRecordingTime(0); }}
                className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-white/5 text-zinc-400">
                    <Video className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Screen Recorder</span>
              </div>
              <div className="w-px h-5 bg-white/10 mx-1" />
              <button 
                onClick={startRecording}
                disabled={isPreparing}
                className="flex items-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
              >
                {isPreparing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
                {isPreparing ? 'Preparing...' : 'Start'}
              </button>
            </>
          )}
        </div>
      </Toolbar>

      {!isRecording && !videoUrl && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm -z-10 animate-fade-in" />
      )}
    </div>
  )
}
