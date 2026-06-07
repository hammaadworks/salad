import React from 'react'
import { X } from 'lucide-react'
import { cn } from '../utils'

interface ToolLayoutProps {
  title: string
  onClose: () => void
  children: React.ReactNode
  className?: string
  isModal?: boolean
}

export default function ToolLayout({ title, onClose, children, className, isModal = false }: ToolLayoutProps) {
  if (isModal) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
        <div 
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "relative flex flex-col bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-slide-up",
            className
          )}
        >
          <header className="h-12 flex items-center justify-between px-5 shrink-0 border-b border-white/5 bg-zinc-900/50">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{title}</h3>
            <button 
              onClick={onClose}
              className="p-1 rounded-md hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </header>
          <div className="flex-1 overflow-auto p-6">
            {children}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("h-full flex flex-col animate-fade-in", className)}>
      {children}
    </div>
  )
}
