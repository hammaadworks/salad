import React, { useState, useEffect } from 'react';
import { ipcRenderer } from 'electron';
import { X, Clipboard, Clock, ChevronLeft, ChevronRight, CornerDownLeft } from 'lucide-react';

interface ClipboardItem {
  id: string;
  text: string;
  time: number;
}

interface ClipboardToolProps {
  onClose: () => void;
}

const ClipboardTool: React.FC<ClipboardToolProps> = ({ onClose }) => {
  const [history, setHistory] = useState<ClipboardItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    // Request initial history
    ipcRenderer.send('get-clipboard-history');

    // Listen for history updates
    const handleHistory = (_event: any, data: ClipboardItem[]) => {
      setHistory(data);
      // Reset to first item (newest) when history updates significantly? 
      // Or keep index? If new item added at 0, maybe we want to see it.
      // Let's reset to 0 to show the new copy.
      if (data.length > 0) setSelectedIndex(0);
    };

    const handleUpdate = (_event: any, data: ClipboardItem[]) => {
      setHistory(data);
    };

    ipcRenderer.on('clipboard-history', handleHistory);
    ipcRenderer.on('clipboard-updated', handleUpdate);

    return () => {
      ipcRenderer.removeListener('clipboard-history', handleHistory);
      ipcRenderer.removeListener('clipboard-updated', handleUpdate);
    };
  }, []);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setSelectedIndex(prev => (prev + 1) % history.length);
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        setSelectedIndex(prev => (prev - 1 + history.length) % history.length);
        e.preventDefault();
      } else if (e.key === 'Enter') {
        if (history[selectedIndex]) {
          handlePaste(history[selectedIndex].text);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, selectedIndex, onClose]);

  const handlePaste = (text: string) => {
    ipcRenderer.send('paste-clipboard-item', text);
    onClose();
  };

  const formatTime = (ms: number) => {
    const date = new Date(ms);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const currentItem = history[selectedIndex];

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col h-[400px] w-[600px] bg-zinc-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
          <div className="flex items-center gap-2">
              <Clipboard className="w-5 h-5 text-green-400" />
              <h2 className="font-semibold text-sm tracking-wide">Clipboard History</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                <p>Clipboard is empty</p>
                <p className="text-xs mt-1">Copy text to see it here</p>
            </div>
          ) : currentItem ? (
            <div className="flex flex-col h-full p-6 animate-in fade-in zoom-in-95 duration-200">
                
                {/* Meta info */}
                <div className="flex justify-between items-center mb-4 text-xs text-zinc-500">
                    <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(currentItem.time)}</span>
                    </div>
                    <div className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">
                        TEXT
                    </div>
                </div>

                {/* Text Content */}
                <div className="flex-1 overflow-y-auto bg-black/20 rounded-lg border border-white/5 p-4 font-mono text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap selection:bg-green-500/30">
                    {currentItem.text}
                </div>

                {/* Navigation Hint Overlay (Subtle) */}
                <div className="absolute top-1/2 left-2 -translate-y-1/2">
                    <button 
                        onClick={() => setSelectedIndex(prev => (prev - 1 + history.length) % history.length)}
                        className="p-2 rounded-full bg-black/40 hover:bg-white/10 transition-all text-zinc-400 hover:text-white"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                </div>
                <div className="absolute top-1/2 right-2 -translate-y-1/2">
                    <button 
                        onClick={() => setSelectedIndex(prev => (prev + 1) % history.length)}
                        className="p-2 rounded-full bg-black/40 hover:bg-white/10 transition-all text-zinc-400 hover:text-white"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
            </div>
          ) : null}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-3 bg-black/40 border-t border-white/10">
           {/* Controls Hint */}
           <div className="flex items-center gap-4 text-[10px] text-zinc-500">
                <div className="flex items-center gap-1">
                    <span className="bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">←</span>
                    <span className="bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">→</span>
                    <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 flex items-center"><CornerDownLeft className="w-3 h-3"/></span>
                    <span>Paste</span>
                </div>
           </div>

           {/* Pagination Counter */}
           {history.length > 0 && (
               <div className="text-xs font-mono font-medium text-zinc-400 bg-zinc-800/50 px-3 py-1 rounded-full border border-white/5">
                   {selectedIndex + 1} <span className="text-zinc-600">/</span> {history.length}
               </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ClipboardTool;
