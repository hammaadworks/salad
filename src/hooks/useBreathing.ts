import { useState, useCallback, useEffect, useRef } from 'react'

export type BreathingPhase = 'inhale' | 'hold' | 'exhale' | 'hold-out'

export interface BreathingTechnique {
  id: string
  name: string
  description: string
  inhale: number
  hold: number
  exhale: number
  holdOut: number
}

export const TECHNIQUES: BreathingTechnique[] = [
  { id: 'box', name: 'Box Breathing', description: 'Used by Navy SEALs to stay calm under pressure.', inhale: 4, hold: 4, exhale: 4, holdOut: 4 },
  { id: '478', name: '4-7-8 Relaxation', description: 'A natural tranquilizer for the nervous system.', inhale: 4, hold: 7, exhale: 8, holdOut: 0 },
  { id: 'awake', name: 'Awake (1-1)', description: 'Quick energy boost for focused work.', inhale: 2, hold: 0, exhale: 2, holdOut: 0 }
]

export function useBreathing() {
  const [activeTechnique, setActiveTechnique] = useState<BreathingTechnique>(TECHNIQUES[0])
  const [phase, setPhase] = useState<BreathingPhase>('inhale')
  const [progress, setHoldProgress] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [cycles, setCycles] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const start = useCallback(() => {
    setIsRunning(true)
    setPhase('inhale')
    setHoldProgress(0)
    setCycles(0)
  }, [])

  const stop = useCallback(() => {
    setIsRunning(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    if (!isRunning) return

    const duration = phase === 'inhale' ? activeTechnique.inhale 
                   : phase === 'hold' ? activeTechnique.hold 
                   : phase === 'exhale' ? activeTechnique.exhale 
                   : activeTechnique.holdOut

    if (duration === 0) {
        // Skip phases with 0 duration
        nextPhase()
        return
    }

    let current = 0
    const step = 0.05
    const interval = 50

    timerRef.current = setInterval(() => {
      current += step
      setHoldProgress(Math.min(1, current / duration))
      
      if (current >= duration) {
        clearInterval(timerRef.current!)
        nextPhase()
      }
    }, interval)

    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isRunning, phase, activeTechnique])

  const nextPhase = () => {
    setHoldProgress(0)
    setPhase(prev => {
      if (prev === 'inhale') return activeTechnique.hold > 0 ? 'hold' : 'exhale'
      if (prev === 'hold') return 'exhale'
      if (prev === 'exhale') {
          if (activeTechnique.holdOut > 0) return 'hold-out'
          setCycles(c => c + 1)
          return 'inhale'
      }
      setCycles(c => c + 1)
      return 'inhale'
    })
  }

  return {
    isRunning,
    start,
    stop,
    phase,
    progress,
    cycles,
    activeTechnique,
    setActiveTechnique
  }
}
