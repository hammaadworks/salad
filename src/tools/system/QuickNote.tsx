import { useState, useEffect, useRef } from 'react'
import { ipcRenderer } from 'electron'
import { Save, Eye, Pen, FileText } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import ToolLayout from '../../components/ToolLayout'
import { cn } from '../../utils'

export default function QuickNote({ onClose }: { onClose: () => void }) {
  const [content, setContent] = useState('')
  const [isPreview, setIsPreview] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const savedDraft = localStorage.getItem('quick-note-draft')
    if (savedDraft) setContent(savedDraft)
  }, [])

  useEffect(() => {
    localStorage.setItem('quick-note-draft', content)
  }, [content])

  useEffect(() => {
    if (!isPreview && textareaRef.current) {
      textareaRef.current.focus()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    
    const handleSaved = (_event: any, { success }: { success: boolean }) => {
        if (success) {
            localStorage.removeItem('quick-note-draft')
            onClose()
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
      onClose()
      return
    }
    ipcRenderer.send('save-quick-note', content)
  }

  return (
    <ToolLayout title="Quick Note" onClose={onClose} isModal className="w-[540px] h-[540px]">
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-zinc-950 border border-white/5 text-blue-500">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Scratchpad</span>
          </div>
          <div className="flex gap-1">
             <button
               onClick={() => setIsPreview(!isPreview)}
               className={cn(
                 "p-2 rounded-lg transition-all",
                 isPreview ? "bg-blue-600/10 text-blue-400 border border-blue-500/20" : "hover:bg-white/5 text-zinc-500 hover:text-white"
               )}
               title={isPreview ? "Edit Mode" : "Preview Markdown"}
             >
               {isPreview ? <Pen className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
             </button>
             <button 
               onClick={handleSave} 
               className="p-2 hover:bg-white/5 rounded-lg transition-all text-zinc-500 hover:text-white"
               title="Save to Desktop (Cmd+S)"
             >
               <Save className="w-4 h-4" />
             </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 bg-zinc-950 border border-white/5 rounded-xl overflow-hidden flex flex-col shadow-inner">
          {isPreview ? (
            <div className="flex-1 w-full p-6 overflow-y-auto prose prose-invert prose-sm max-w-none text-zinc-400">
                <ReactMarkdown>{content || '*No content*'}</ReactMarkdown>
            </div>
          ) : (
            <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 w-full p-6 text-sm leading-relaxed focus:outline-none resize-none bg-transparent font-medium text-zinc-300 placeholder-zinc-700 selection:bg-blue-500/30"
                placeholder="Type markdown here...&#10;&#10;Use Cmd+S to save."
            />
          )}
        </div>
        
        {/* Footer */}
        <div className="mt-4 flex justify-between items-center text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
            <span>{content.length} characters</span>
            <div className="flex items-center gap-4">
               <span>Markdown</span>
               <button onClick={handleSave} className="text-blue-500 hover:text-blue-400 transition-colors">
                  Save Copy
               </button>
            </div>
        </div>
      </div>
    </ToolLayout>
  )
}
