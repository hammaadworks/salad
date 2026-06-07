import { useState, useEffect } from 'react'
import { Play, Pause, RotateCcw, Coffee, Brain, CheckCircle2 } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import { cn } from '../../utils'

interface FocusToolProps {
  onClose: () => void
}

export default function FocusTool({ onClose }: FocusToolProps) {
  const [mode, setMode] = useState<'focus' | 'break'>('focus')
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isActive, setIsActive] = useState(false)
  const [sessionsCompleted, setSessionsCompleted] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1)
      }, 1000)
    } else if (isActive && timeLeft === 0) {
      setIsActive(false)
      if (mode === 'focus') {
          setSessionsCompleted(s => s + 1)
          setMode('break')
          setTimeLeft(5 * 60)
      } else {
          setMode('focus')
          setTimeLeft(25 * 60)
      }
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, timeLeft, mode])

  const toggleTimer = () => setIsActive(!isActive)
  
  const resetTimer = () => {
    setIsActive(false)
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60)
  }

  const switchMode = (newMode: 'focus' | 'break') => {
      setMode(newMode)
      setIsActive(false)
      setTimeLeft(newMode === 'focus' ? 25 * 60 : 5 * 60)
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const totalTime = mode === 'focus' ? 25 * 60 : 5 * 60
  const progress = ((totalTime - timeLeft) / totalTime) * 100
  const strokeDashoffset = 283 - (283 * progress) / 100

  return (
    <ToolLayout title="Focus Timer" onClose={onClose} isModal className="w-[360px]">
      <div className="flex flex-col items-center">
        {/* Mode Switcher */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-white/5 mb-10">
            <button 
                onClick={() => switchMode('focus')}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-all",
                  mode === 'focus' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                )}
            >
                <Brain className="w-3.5 h-3.5" /> Focus
            </button>
            <button 
                 onClick={() => switchMode('break')}
                 className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-all",
                  mode === 'break' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                )}
            >
                <Coffee className="w-3.5 h-3.5" /> Break
            </button>
        </div>

        {/* Timer Circle */}
        <div className="relative flex items-center justify-center w-56 h-56 mb-10">
            <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" className="stroke-zinc-800/50" strokeWidth="2" />
                <circle 
                    cx="50" cy="50" r="45" fill="none" 
                    className={cn(
                      "transition-all duration-1000 ease-linear",
                      mode === 'focus' ? 'stroke-blue-500' : 'stroke-emerald-500'
                    )} 
                    strokeWidth="2" 
                    strokeDasharray="283" 
                    strokeDashoffset={strokeDashoffset} 
                    strokeLinecap="round" 
                />
            </svg>
            <div className="flex flex-col items-center z-10">
                <span className="text-6xl font-light tracking-tighter text-white font-mono">
                    {formatTime(timeLeft)}
                </span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-2">
                    {mode === 'focus' ? 'Deep Work' : 'Refuel'}
                </span>
            </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
            <button 
                onClick={resetTimer}
                className="p-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-all border border-white/5"
                title="Reset"
            >
                <RotateCcw className="w-4 h-4" />
            </button>
            <button 
                onClick={toggleTimer}
                className={cn(
                  "p-5 rounded-2xl text-white transition-all shadow-xl hover:scale-105 active:scale-95",
                  mode === 'focus' ? 'bg-blue-600 shadow-blue-900/20' : 'bg-emerald-600 shadow-emerald-900/20'
                )}
            >
                {isActive ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
            </button>
        </div>

        {/* Stats */}
        <div className="mt-10 pt-6 border-t border-white/5 w-full flex items-center justify-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500/50" />
            <span>{sessionsCompleted} Sessions</span>
        </div>
      </div>
    </ToolLayout>
  )
}
