import { useState, useCallback, useRef } from 'react'

export interface Zikr {
  id: string
  arabic: string
  english: string
  transliteration: string
  countTarget: number
  color: string
}

export interface ZikrBundle {
  id: string
  title: string
  description: string
  zikrs: Zikr[]
}

export function useTasbeeh() {
  const [activeZikrIndex, setActiveZikrIndex] = useState(0)
  const [currentCount, setCurrentCount] = useState(0)
  const [totalSessionCount, setTotalSessionCount] = useState(0)
  const [status, setStatus] = useState<'idle' | 'active' | 'finished'>('idle')
  
  const [isHolding, setIsHolding] = useState(false)
  const [holdProgress, setHoldProgress] = useState(0)
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const handleIncrement = useCallback((activeZikr: Zikr, activeBundle: ZikrBundle | null) => {
    const nextCount = currentCount + 1
    setTotalSessionCount(prev => prev + 1)
    
    if (nextCount >= activeZikr.countTarget) {
      if (activeBundle && activeZikrIndex < activeBundle.zikrs.length - 1) {
        setActiveZikrIndex(prev => prev + 1)
        setCurrentCount(0)
      } else {
        setCurrentCount(activeZikr.countTarget)
        setStatus('finished')
      }
    } else {
      setCurrentCount(nextCount)
    }
  }, [currentCount, activeZikrIndex])

  const startHold = useCallback(() => {
    setIsHolding(true)
    setHoldProgress(0)
    holdIntervalRef.current = setInterval(() => {
      setHoldProgress(p => Math.min(1, p + 0.02))
    }, 30)
  }, [])

  const stopHold = useCallback(() => {
    setIsHolding(false)
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current)
    const finalProgress = holdProgress
    setHoldProgress(0)
    return finalProgress > 0.3 // Return true if held long enough to count
  }, [holdProgress])

  const reset = useCallback(() => {
    setCurrentCount(0)
    setActiveZikrIndex(0)
    setTotalSessionCount(0)
    setStatus('idle')
  }, [])

  return {
    status,
    setStatus,
    currentCount,
    setCurrentCount,
    activeZikrIndex,
    setActiveZikrIndex,
    totalSessionCount,
    isHolding,
    holdProgress,
    handleIncrement,
    startHold,
    stopHold,
    reset
  }
}
