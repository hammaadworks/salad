import React from 'react'
import { X } from 'lucide-react'

interface ToolbarProps {
  children: React.ReactNode
  onClose?: () => void
  className?: string
}

const Toolbar: React.FC<ToolbarProps> = ({ children, onClose, className = '' }) => {
  return (
    <div className={`fixed z-50 interactive-zone flex items-center gap-2 bg-zinc-900/90 p-2 rounded-xl border border-white/10 shadow-2xl backdrop-blur ${className}`}>
      {children}
      {onClose && (
        <>
          <div className="w-px bg-white/10 mx-1 h-6"></div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-red-500/20 rounded text-zinc-400 hover:text-red-400 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  )
}

export default Toolbar
