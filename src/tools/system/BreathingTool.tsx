import { useState, useEffect, useRef } from 'react'
import { X, Play, Pause, RotateCcw, Wind, Volume2, VolumeX } from 'lucide-react'
import { useBreathing, TECHNIQUES } from '../../hooks/useBreathing'
import { cn } from '../../utils'

const SOUNDS = [
    { id: 'none', label: 'Silence', url: '' },
    { id: 'rain', label: 'Rain', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }, 
    { id: 'forest', label: 'Forest', url: 'https://www.soundjay.com/nature/forest-1.mp3' },
    { id: 'waves', label: 'Waves', url: 'https://www.soundjay.com/nature/ocean-wave-1.mp3' }
]

export default function BreathingTool({ onClose }: { onClose: () => void }) {
  const { 
    isRunning, start, stop, phase, progress, cycles, 
    activeTechnique, setActiveTechnique 
  } = useBreathing()

  const [isMuted, setIsMuted] = useState(false)
  const [selectedSound, setSelectedSound] = useState(SOUNDS[0].id)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const sound = SOUNDS.find(s => s.id === selectedSound)
    if (isRunning && !isMuted && sound?.url) {
      if (!audioRef.current || audioRef.current.src !== sound.url) {
        if (audioRef.current) audioRef.current.pause()
        audioRef.current = new Audio(sound.url)
        audioRef.current.loop = true
        audioRef.current.volume = 0.2
      }
      audioRef.current.play().catch(() => {})
    } else {
      if (audioRef.current) audioRef.current.pause()
    }
  }, [isRunning, isMuted, selectedSound])

  return (
    <div className="relative h-full w-full bg-zinc-950 text-white flex flex-col items-center justify-center overflow-hidden selection:bg-blue-500/30">
      {/* Immersive Background */}
      <div className="absolute inset-0 pointer-events-none">
          <div className={cn(
              "absolute inset-0 bg-blue-500/5 transition-all duration-[3000ms]",
              phase === 'inhale' ? 'opacity-100 scale-105' : 'opacity-30 scale-100'
          )} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="absolute top-8 left-8 right-8 flex justify-between items-center z-50 animate-fade-in">
          <button 
            onClick={onClose}
            className="group flex items-center gap-3 px-4 py-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-500 hover:text-white transition-all shadow-xl"
          >
              <X className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Exit Session</span>
          </button>

          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={cn(
              "p-3 rounded-lg border transition-all", 
              isMuted ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-zinc-900 border-white/5 text-zinc-500 hover:text-white"
            )}
          >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
      </header>

      {/* Main Experience */}
      {!isRunning ? (
          <div className="z-10 w-full max-w-4xl px-8 animate-fade-in flex flex-col items-center">
              <div className="text-center mb-16">
                  <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
                      <Wind className="w-8 h-8 text-blue-500" />
                  </div>
                  <h1 className="text-5xl font-bold tracking-tight mb-4">Sanctuary.</h1>
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.4em] opacity-60">
                      Calm your mind. Find your center.
                  </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16 w-full">
                  {TECHNIQUES.map(t => (
                      <button 
                        key={t.id}
                        onClick={() => setActiveTechnique(t)}
                        className={cn(
                            "group p-6 rounded-xl border transition-all duration-300 text-left relative overflow-hidden",
                            activeTechnique.id === t.id 
                                ? "bg-blue-600/10 border-blue-500/40 shadow-xl" 
                                : "bg-zinc-900/50 border-white/5 hover:bg-zinc-900 hover:border-white/10"
                        )}
                      >
                          <h3 className="text-lg font-bold mb-2 text-zinc-100 group-hover:text-white transition-colors">{t.name}</h3>
                          <p className="text-xs text-zinc-500 font-medium leading-relaxed mb-4">{t.description}</p>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                              {t.inhale}-{t.hold}-{t.exhale}-{t.holdOut}
                          </div>
                      </button>
                  ))}
              </div>

              <div className="flex flex-col items-center gap-10">
                  <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-white/5 shadow-inner">
                      {SOUNDS.map(s => (
                          <button 
                            key={s.id}
                            onClick={() => setSelectedSound(s.id)}
                            className={cn(
                                "px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                                selectedSound === s.id ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-white"
                            )}
                          >
                              {s.label}
                          </button>
                      ))}
                  </div>

                  <button 
                    onClick={start}
                    className="group flex items-center gap-3 px-12 py-4 rounded-xl bg-blue-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-blue-500 hover:scale-105 transition-all shadow-xl shadow-blue-900/20"
                  >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      Begin Session
                  </button>
              </div>
          </div>
      ) : (
          <div className="z-10 flex flex-col items-center justify-between h-full w-full py-24 px-8 animate-fade-in">
              <div className="text-center">
                  <div className="flex items-center gap-3 justify-center opacity-40 mb-6">
                      <div className="h-px w-6 bg-white" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.4em]">{activeTechnique.name}</span>
                      <div className="h-px w-6 bg-white" />
                  </div>
                  <h2 className="text-7xl font-bold tracking-tighter uppercase mb-2">
                      {phase === 'hold-out' ? 'Rest' : phase}
                  </h2>
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.4em]">Cycle {cycles + 1}</p>
              </div>

              {/* The Circle */}
              <div className="relative flex items-center justify-center w-[360px] h-[360px]">
                  <div className="absolute inset-0 rounded-full border border-white/5 shadow-inner" />
                  <div 
                    className="rounded-full bg-blue-600/10 border border-blue-500/30 transition-all duration-500 ease-out shadow-2xl"
                    style={{ 
                        width: phase === 'inhale' ? `${180 + progress * 180}px` 
                             : phase === 'hold' ? '360px'
                             : phase === 'exhale' ? `${360 - progress * 180}px`
                             : '180px',
                        height: phase === 'inhale' ? `${180 + progress * 180}px` 
                              : phase === 'hold' ? '360px'
                              : phase === 'exhale' ? `${360 - progress * 180}px`
                              : '180px',
                        opacity: phase === 'hold-out' ? 0.3 : 1
                    }}
                  />
                  {/* Progress Ring */}
                  <svg className="absolute inset-[-16px] w-[392px] h-[392px] rotate-[-90deg]">
                      <circle 
                        cx="196" cy="196" r="188" 
                        fill="transparent" 
                        stroke="currentColor" 
                        strokeWidth="1"
                        className="text-white/5"
                      />
                      <circle 
                        cx="196" cy="196" r="188" 
                        fill="transparent" 
                        stroke="currentColor" 
                        strokeWidth="2"
                        strokeDasharray={1181}
                        strokeDashoffset={1181 * (1 - progress)}
                        className="text-blue-500 transition-all duration-100 ease-linear"
                      />
                  </svg>
              </div>

              <div className="flex items-center gap-6">
                  <button 
                    onClick={stop}
                    className="p-5 rounded-xl bg-zinc-900 border border-white/5 text-zinc-500 hover:text-white transition-all shadow-xl"
                  >
                      <Pause className="w-5 h-5 fill-current" />
                  </button>
                  <button 
                    onClick={() => { stop(); start(); }}
                    className="p-5 rounded-xl bg-zinc-900 border border-white/5 text-zinc-500 hover:text-white transition-all shadow-xl"
                  >
                      <RotateCcw className="w-5 h-5" />
                  </button>
              </div>
          </div>
      )}
    </div>
  )
}
