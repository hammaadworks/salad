import React from 'react'
import { ToolRegistry } from '../registry'
import { useAppStore } from '../store'
import { cn } from '../utils'

const NavigationStrip: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    setViewMode, 
    pinnedToolIds 
  } = useAppStore()

  const pinnedTools = pinnedToolIds
    .map(id => ToolRegistry.find(t => t.id === id))
    .filter(Boolean)

  const leftTools = pinnedTools.slice(0, 4)
  const rightTools = pinnedTools.slice(4, 8)

  return (
    <div 
      className="w-full h-full flex items-center justify-center select-none overflow-hidden active:cursor-grabbing"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div 
        className={cn(
          "h-14 flex items-center gap-1 px-2 rounded-2xl",
          "bg-zinc-900/80 backdrop-blur-2xl",
          "shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
          "transition-all duration-500 ease-out transform scale-100 hover:scale-[1.01] hover:bg-zinc-900/90"
        )}
      >
        {/* Drag Handle Left */}
        <div className="w-4 h-6 flex flex-col gap-0.5 items-center justify-center opacity-30 ml-1">
          <div className="flex gap-0.5">
            <div className="w-1 h-1 bg-white rounded-full" />
            <div className="w-1 h-1 bg-white rounded-full" />
          </div>
          <div className="flex gap-0.5">
            <div className="w-1 h-1 bg-white rounded-full" />
            <div className="w-1 h-1 bg-white rounded-full" />
          </div>
          <div className="flex gap-0.5">
            <div className="w-1 h-1 bg-white rounded-full" />
            <div className="w-1 h-1 bg-white rounded-full" />
          </div>
        </div>

        {/* Left Tools */}
        <div className="flex items-center gap-0.5 px-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          {leftTools.map((tool, idx) => {
            const Icon = tool!.icon
            return (
              <button
                key={tool!.id}
                onClick={() => { setActiveTab(tool!.id); setViewMode('mini'); }}
                title={`${tool!.label} (${idx + 1})`}
                className={cn(
                  "w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 group relative",
                  activeTab === tool!.id ? "bg-blue-500/20 text-blue-400 shadow-inner shadow-blue-500/10" : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
                )}
              >
                <Icon className={cn("w-4.5 h-4.5", activeTab === tool!.id ? "text-blue-400" : "group-hover:scale-110 transition-transform")} />
                {activeTab === tool!.id && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]" />
                )}
              </button>
            )
          })}
        </div>

        {/* Home Button / Salad Logo */}
        <div className="px-1.5 flex items-center justify-center" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button 
            onClick={() => { setViewMode('full'); setActiveTab('home'); }}
            className={cn(
              "w-11 h-11 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-xl flex items-center justify-center shadow-lg",
              "transition-all duration-300 transform hover:scale-110 active:scale-95 group overflow-hidden"
            )}
            title="Dashboard (5)"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <img 
              src="./icon.svg" 
              alt="Salad" 
              className="w-7 h-7 object-contain z-10 transition-all duration-500 group-hover:rotate-[360deg]" 
            />
          </button>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-0.5 px-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          {rightTools.map((tool, idx) => {
            const Icon = tool!.icon
            return (
              <button
                key={tool!.id}
                onClick={() => { setActiveTab(tool!.id); setViewMode('mini'); }}
                title={`${tool!.label} (${idx + 6})`}
                className={cn(
                  "w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 group relative",
                  activeTab === tool!.id ? "bg-blue-500/20 text-blue-400 shadow-inner shadow-blue-500/10" : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
                )}
              >
                <Icon className={cn("w-4.5 h-4.5", activeTab === tool!.id ? "text-blue-400" : "group-hover:scale-110 transition-transform")} />
                {activeTab === tool!.id && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]" />
                )}
              </button>
            )
          })}
        </div>

        {/* Drag Handle Right */}
        <div className="w-4 h-6 flex flex-col gap-0.5 items-center justify-center opacity-30 mr-1">
          <div className="flex gap-0.5">
            <div className="w-1 h-1 bg-white rounded-full" />
            <div className="w-1 h-1 bg-white rounded-full" />
          </div>
          <div className="flex gap-0.5">
            <div className="w-1 h-1 bg-white rounded-full" />
            <div className="w-1 h-1 bg-white rounded-full" />
          </div>
          <div className="flex gap-0.5">
            <div className="w-1 h-1 bg-white rounded-full" />
            <div className="w-1 h-1 bg-white rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default NavigationStrip
