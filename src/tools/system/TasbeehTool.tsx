import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { X, RotateCcw,  Volume2, VolumeX, Heart } from 'lucide-react'
import { useTasbeeh, Zikr, ZikrBundle } from '../../hooks/useTasbeeh'
import { cn } from '../../utils'

const DEFAULT_ZIKRS: Zikr[] = [
  { id: 'subhanallah', arabic: 'سُبْحَانَ ٱللَّٰهِ', english: 'Glory be to Allah', transliteration: 'Subhan-Allah', countTarget: 33, color: 'blue' },
  { id: 'alhamdulillah', arabic: 'ٱلْحَمْدُ لِلَّٰهِ', english: 'All praise is due to Allah', transliteration: 'Alhamdulillah', countTarget: 33, color: 'blue' },
  { id: 'allahuakbar', arabic: 'ٱللَّٰهُ أَكْبَرُ', english: 'Allah is the Greatest', transliteration: 'Allahu Akbar', countTarget: 34, color: 'blue' },
  { id: 'astaghfirullah', arabic: 'أَسْتَغْفِرُ ٱللَّٰهَ', english: 'I seek forgiveness from Allah', transliteration: 'Astaghfirullah', countTarget: 100, color: 'blue' },
  { id: 'la-ilaha-illallah', arabic: 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ', english: 'There is no god but Allah', transliteration: 'La ilaha illallah', countTarget: 100, color: 'blue' }
]

const PRESET_BUNDLES: ZikrBundle[] = [
  { id: 'post-salah', title: 'Post-Salah Adhkar', description: 'The sacred sequence after every prayer.', zikrs: [DEFAULT_ZIKRS[0], DEFAULT_ZIKRS[1], DEFAULT_ZIKRS[2]] },
  { id: 'morning-evening', title: 'Morning & Evening', description: 'Strengthen your heart at the start and end of the day.', zikrs: [DEFAULT_ZIKRS[3], DEFAULT_ZIKRS[4]] }
]

const SOUNDS = [
    { id: 'none', label: 'Silence', url: '' },
    { id: 'rain', label: 'Rain', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }, 
    { id: 'forest', label: 'Forest', url: 'https://www.soundjay.com/nature/forest-1.mp3' },
    { id: 'waves', label: 'Waves', url: 'https://www.soundjay.com/nature/ocean-wave-1.mp3' }
]

const TICK_SOUND = 'https://www.soundjay.com/button/button-50.mp3' 

interface Ripple {
    id: number
    x: number
    y: number
}

export default function TasbeehTool({ onClose }: { onClose: () => void }) {
  const { 
    status, setStatus, currentCount, setCurrentCount, activeZikrIndex, 
    setActiveZikrIndex,  isHolding, holdProgress, 
    handleIncrement, startHold, stopHold, reset 
  } = useTasbeeh()

  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(PRESET_BUNDLES[0].id)
  const [isMuted, setIsMuted] = useState(false)
  const [selectedSound] = useState(SOUNDS[0].id)
  const [ripples, setRipples] = useState<Ripple[]>([])

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const tickRef = useRef<HTMLAudioElement | null>(null)

  const activeBundle = useMemo(() => selectedBundleId ? PRESET_BUNDLES.find(b => b.id === selectedBundleId) : null, [selectedBundleId])
  const activeZikr = useMemo(() => {
    if (status !== 'active') return null
    return activeBundle ? activeBundle.zikrs[activeZikrIndex] : null
  }, [status, activeBundle, activeZikrIndex])

  useEffect(() => {
    const sound = SOUNDS.find(s => s.id === selectedSound)
    if (status === 'active' && !isMuted && sound?.url) {
      if (!audioRef.current || audioRef.current.src !== sound.url) {
        if (audioRef.current) audioRef.current.pause()
        audioRef.current = new Audio(sound.url)
        audioRef.current.loop = true
        audioRef.current.volume = 0.15
      }
      audioRef.current.play().catch(() => {})
    } else {
      if (audioRef.current) audioRef.current.pause()
    }
  }, [status, isMuted, selectedSound])

  useEffect(() => {
      tickRef.current = new Audio(TICK_SOUND)
      tickRef.current.volume = 0.2
      return () => { if (audioRef.current) audioRef.current.pause() }
  }, [])

  const triggerTick = useCallback(() => {
      if (!isMuted && tickRef.current) {
          tickRef.current.currentTime = 0
          const playPromise = tickRef.current.play()
          if (playPromise !== undefined) {
              playPromise.catch(() => {})
          }
      }
  }, [isMuted])

  const onPointerDown = (e: React.PointerEvent) => {
      if (status !== 'active') return
      startHold()
      const newRipple = { id: Date.now(), x: e.clientX, y: e.clientY }
      setRipples(prev => [...prev, newRipple])
      setTimeout(() => setRipples(prev => prev.filter(r => r.id !== newRipple.id)), 1000)
  }

  const onPointerUp = () => {
      if (status !== 'active') return
      stopHold()
      if (activeZikr) {
          triggerTick()
          handleIncrement(activeZikr, activeBundle || null)
      }
  }

  return (
    <div className="relative h-full w-full bg-zinc-950 text-white flex flex-col items-center justify-center overflow-hidden selection:bg-blue-500/30">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="absolute top-8 left-8 right-8 flex justify-between items-center z-50 animate-fade-in">
          <button 
            onClick={() => status === 'idle' ? onClose() : reset()}
            className="group flex items-center gap-3 px-4 py-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-500 hover:text-white transition-all shadow-xl"
          >
              <X className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">{status === 'idle' ? 'Exit Session' : 'Back'}</span>
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

      {/* Interactive Canvas */}
      <div 
        data-testid="tasbeeh-canvas"
        className={cn(
            "relative z-10 flex-1 w-full flex flex-col items-center justify-center cursor-pointer select-none",
            status !== 'active' && "pointer-events-none"
        )}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {status === 'idle' && (
            <div className="z-10 w-full max-w-4xl px-8 animate-fade-in flex flex-col items-center">
                <div className="text-center mb-16">
                    <Heart className="w-16 h-16 text-blue-500/20 fill-blue-500/10 mb-6 mx-auto" />
                    <h1 className="text-5xl font-bold tracking-tight mb-4">Remembrance.</h1>
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.4em] opacity-60">Nourish your soul through Zikr</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16 w-full">
                    {PRESET_BUNDLES.map(bundle => (
                        <button 
                            key={bundle.id}
                            onClick={() => {
                                setSelectedBundleId(bundle.id)
                                setActiveZikrIndex(0)
                                setCurrentCount(0)
                                setStatus('active')
                            }}
                            className="group p-8 rounded-xl bg-zinc-900/50 border border-white/5 hover:bg-zinc-900 hover:border-blue-500/30 transition-all duration-300 text-left relative overflow-hidden"
                        >
                            <h3 className="text-xl font-bold mb-3 text-zinc-100 group-hover:text-white transition-colors">{bundle.title}</h3>
                            <p className="text-zinc-500 text-xs font-medium mb-6 max-w-[260px] leading-relaxed">{bundle.description}</p>
                            <div className="flex flex-wrap gap-2">
                                {bundle.zikrs.map(z => (
                                    <span key={z.id} className="px-2 py-1 rounded bg-white/5 border border-white/5 text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                                        {z.transliteration}
                                    </span>
                                ))}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        )}

        {status === 'active' && activeZikr && (
            <div className="flex flex-col items-center justify-between h-full w-full py-24 px-8">
                <div className="text-center animate-fade-in">
                    <div className="flex items-center gap-3 justify-center opacity-40 mb-6">
                        <div className="h-px w-6 bg-white" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.4em]">{activeBundle?.title || 'Personal'}</span>
                        <div className="h-px w-6 bg-white" />
                    </div>
                    <h2 className="text-8xl font-arabic leading-none mb-10 drop-shadow-2xl">{activeZikr.arabic}</h2>
                    <p className="text-2xl font-bold tracking-tight text-blue-500 mb-2">{activeZikr.transliteration}</p>
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest opacity-60 italic">{activeZikr.english}</p>
                </div>

                <div className="relative flex items-center justify-center w-[400px] h-[400px]">
                    <div 
                        className="absolute inset-0 rounded-full bg-blue-600/5 border border-white/5 shadow-inner transition-all duration-150"
                        style={{ transform: `scale(${1 + holdProgress * 0.5})`, opacity: isHolding ? 0.8 : 0.3 }}
                    />
                    <div className="z-20 text-[12rem] font-bold tabular-nums leading-none tracking-tighter drop-shadow-2xl text-white/90">
                        {currentCount}
                    </div>
                </div>

                <div className="flex flex-col items-center gap-10">
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-[10px] font-bold text-blue-500/50 uppercase tracking-[0.5em]">Target {activeZikr.countTarget}</p>
                        <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest">Tap or Hold</p>
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); reset(); }}
                        className="pointer-events-auto p-4 rounded-xl bg-zinc-900 border border-white/5 text-zinc-500 hover:text-white transition-all shadow-xl"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                </div>
            </div>
        )}

        {status === 'finished' && (
            <div className="pointer-events-auto flex flex-col items-center text-center animate-fade-in">
                <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-10 shadow-xl">
                    <Heart className="w-10 h-10 text-blue-500 fill-blue-500/20" />
                </div>
                <h2 className="text-5xl font-bold tracking-tight mb-6">Serenity Found.</h2>
                <p className="text-zinc-500 text-sm max-w-md mb-12 leading-relaxed">
                    You completed your remembrances. May the tranquility of this moment stay with you.
                </p>
                <div className="flex gap-4">
                    <button onClick={reset} className="px-10 py-4 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl">
                        New Session
                    </button>
                    <button onClick={onClose} className="px-10 py-4 rounded-xl bg-zinc-900 border border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl">
                        Exit Sanctuary
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* Ripple Effects */}
      {ripples.map(ripple => (
          <div key={ripple.id} className="absolute pointer-events-none w-32 h-32 border border-blue-500/20 rounded-full animate-ripple" style={{ left: ripple.x - 64, top: ripple.y - 64 }} />
      ))}
    </div>
  )
}
