import { useState, useEffect, useRef } from 'react'
import { ipcRenderer } from 'electron'
import { Save, X, Eye, Pen } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export default function QuickNote({ onClose }: { onClose?: () => void }) {
  const [content, setContent] = useState('')
  const [isPreview, setIsPreview] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // Focus textarea on mount if not in preview
    if (!isPreview && textareaRef.current) {
      textareaRef.current.focus()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSave() 
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    
    const handleSaved = (_event: any, { success }: { success: boolean }) => {
        if (success) {
            if (onClose) {
                onClose()
            } else {
                window.close() // Fallback for standalone window
            }
        }
    }

    window.addEventListener('keydown', handleKeyDown)
    ipcRenderer.on('quick-note-saved', handleSaved)
    
    return () => {
        window.removeEventListener('keydown', handleKeyDown)
        ipcRenderer.removeListener('quick-note-saved', handleSaved)
    }
  }, [content, isPreview, onClose])

  const handleSave = () => {
    if (!content.trim()) {
      if (onClose) onClose(); else window.close();
      return
    }
    ipcRenderer.send('save-quick-note', content)
  }

  const handleCloseWithoutSave = () => {
     if (onClose) onClose(); else window.close();
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-900 text-white border border-white/20 overflow-hidden drag-region">
      {/* Header / Drag Area */}
      <div className="flex justify-between items-center p-2 bg-zinc-800 border-b border-white/10" style={{ WebkitAppRegion: 'drag' } as any}>
        <span className="text-xs font-bold text-zinc-400 pl-2">Quick Note (.md)</span>
        <div className="flex gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
           <button
             onClick={() => setIsPreview(!isPreview)}
             className="p-1 hover:bg-white/10 rounded text-blue-400"
             title={isPreview ? "Edit" : "Preview Markdown"}
           >
             {isPreview ? <Pen className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
           </button>
           <button 
             onClick={handleSave} 
             className="p-1 hover:bg-white/10 rounded text-green-400"
             title="Save & Close (Cmd+S)"
           >
             <Save className="w-4 h-4" />
           </button>
           <button 
             onClick={handleCloseWithoutSave} 
             className="p-1 hover:bg-white/10 rounded text-red-400"
             title="Close (Saved automatically)"
           >
             <X className="w-4 h-4" />
           </button>
        </div>
      </div>

      {isPreview ? (
        <div 
            className="flex-1 w-full bg-zinc-900 p-4 text-sm overflow-y-auto prose prose-invert prose-sm max-w-none 
            [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 
            [&>h1]:text-xl [&>h1]:font-bold [&>h1]:mb-2
            [&>h2]:text-lg [&>h2]:font-bold [&>h2]:mb-2
            [&>h3]:font-bold [&>h3]:mb-1
            [&>p]:mb-2 [&>blockquote]:border-l-4 [&>blockquote]:border-zinc-500 [&>blockquote]:pl-2 [&>blockquote]:italic"
            style={{ WebkitAppRegion: 'no-drag' } as any}
        >
            <ReactMarkdown>{content || '*No content*'}</ReactMarkdown>
        </div>
      ) : (
        <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 w-full bg-zinc-900 p-3 text-sm focus:outline-none resize-none font-mono"
            placeholder="Type your markdown here..."
            style={{ WebkitAppRegion: 'no-drag' } as any}
        />
      )}
      
      {!isPreview && (
        <div className="text-[10px] text-zinc-600 p-1 text-right bg-zinc-900">
            {content.length} chars
        </div>
      )}
    </div>
  )
}
