import React, { useState, useEffect, useRef } from 'react';
import { ipcRenderer } from 'electron';
import { Search, Clock, Trash2, AlertCircle, Video } from 'lucide-react';
import ToolLayout from '../../components/ToolLayout';
import { cn } from '../../utils';

interface ClipboardItem {
  id: string;
  text?: string;
  image?: string;
  time: number;
  type: 'text' | 'image' | 'video';
}

interface ClipboardToolProps {
  onClose: () => void;
}

const ClipboardTool: React.FC<ClipboardToolProps> = ({ onClose }) => {
  const [history, setHistory] = useState<ClipboardItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [fullImageMap, setFullImageMap] = useState<Record<string, string>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredHistory = history.filter(item => {
    const query = searchQuery.toLowerCase();
    if (query === '') return true;
    if (item.type === 'image') return 'image'.includes(query);
    if (item.type === 'video') return 'video'.includes(query) || item.text?.toLowerCase().includes(query);
    return item.text?.toLowerCase().includes(query);
  });

  useEffect(() => {
      const item = filteredHistory[selectedIndex];
      if (item && item.type === 'image' && !fullImageMap[item.id]) {
          ipcRenderer.invoke('get-clipboard-full-image', item.id).then(full => {
              if (full) setFullImageMap(prev => ({...prev, [item.id]: full}));
          });
      }
  }, [selectedIndex, filteredHistory, fullImageMap]);

  useEffect(() => {
    ipcRenderer.send('get-clipboard-history');
    const handleHistory = (_event: any, data: ClipboardItem[]) => setHistory(data);
    ipcRenderer.on('clipboard-history', handleHistory);
    ipcRenderer.on('clipboard-updated', handleHistory);
    return () => {
      ipcRenderer.removeListener('clipboard-history', handleHistory);
      ipcRenderer.removeListener('clipboard-updated', handleHistory);
    };
  }, []);

  useEffect(() => {
    if (selectedIndex >= filteredHistory.length) {
      setSelectedIndex(Math.max(0, filteredHistory.length - 1));
    }
  }, [filteredHistory.length, selectedIndex]);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (listRef.current) {
        const activeItem = listRef.current.children[selectedIndex] as HTMLElement;
        if (activeItem) {
            activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }
  }, [selectedIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(filteredHistory.length - 1, prev + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = filteredHistory[selectedIndex];
        if (item) {
          if (item.type === 'image') handlePasteImage(fullImageMap[item.id] || item.image!);
          else handlePaste(item.text!);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Backspace' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (filteredHistory[selectedIndex]) handleDelete(filteredHistory[selectedIndex].id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredHistory, selectedIndex, onClose, fullImageMap]);

  const handlePaste = (text: string) => {
    ipcRenderer.send('paste-clipboard-item', text);
    onClose();
  };

  const handlePasteImage = (dataUrl: string) => {
      ipcRenderer.send('copy-image', { dataUrl });
      onClose();
  };

  const handleDelete = (id: string) => ipcRenderer.send('delete-clipboard-item', id);

  const formatTime = (ms: number) => {
    const date = new Date(ms);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const currentItem = filteredHistory[selectedIndex];

  return (
    <ToolLayout title="Clipboard History" onClose={onClose} isModal className="w-[840px] h-[540px]">
      <div className="flex flex-col h-full">
        {/* Search Bar Header */}
        <div className="flex items-center px-4 py-2.5 bg-zinc-950 border border-white/5 rounded-xl mb-4">
          <Search className="w-4 h-4 text-zinc-500 mr-3" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedIndex(0);
            }}
            placeholder="Search history..."
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder-zinc-600 font-medium text-zinc-100"
          />
          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-2 py-0.5 bg-white/5 rounded">
              {filteredHistory.length}
          </span>
        </div>

        {/* Split Pane Content */}
        <div className="flex flex-1 gap-4 overflow-hidden">
          {/* Left: List */}
          <div className="w-80 overflow-y-auto space-y-1 pr-1 custom-scrollbar" ref={listRef}>
            {filteredHistory.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 p-8 text-center bg-zinc-950/50 rounded-xl border border-white/5 border-dashed">
                    <AlertCircle className="w-6 h-6 mb-2 opacity-50" />
                    <p className="text-xs font-medium">Empty history</p>
                </div>
            ) : (
                filteredHistory.map((item, index) => (
                    <button 
                        key={item.id}
                        onClick={() => setSelectedIndex(index)}
                        onDoubleClick={() => item.type === 'image' ? handlePasteImage(fullImageMap[item.id] || item.image!) : handlePaste(item.text!)}
                        className={cn(
                          "w-full flex flex-col p-3 rounded-lg border transition-all text-left",
                          index === selectedIndex 
                            ? "bg-blue-600/10 border-blue-500/30 text-white" 
                            : "bg-zinc-950/50 border-white/5 text-zinc-400 hover:bg-zinc-900"
                        )}
                    >
                        <div className="text-[13px] line-clamp-2 font-medium tracking-tight flex items-center gap-2 mb-1.5">
                            {item.type === 'image' ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-zinc-900 rounded border border-white/10 overflow-hidden flex-shrink-0">
                                        <img src={item.image} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <span className="text-zinc-500 italic text-[11px]">Image Asset</span>
                                </div>
                            ) : item.type === 'video' ? (
                                <div className="flex items-center gap-2 text-blue-400">
                                    <Video className="w-3.5 h-3.5" />
                                    <span className="truncate">{item.text?.split('/').pop()?.split('\\').pop()}</span>
                                </div>
                            ) : (
                                item.text?.trim() || "Empty"
                            )}
                        </div>
                        <div className="text-[10px] text-zinc-600 flex items-center gap-1 font-bold uppercase tracking-widest">
                            <Clock className="w-3 h-3" />
                            {formatTime(item.time)}
                        </div>
                    </button>
                ))
            )}
          </div>

          {/* Right: Preview */}
          <div className="flex-1 bg-zinc-950 border border-white/5 rounded-xl flex flex-col overflow-hidden relative shadow-inner">
            {currentItem ? (
                <>
                    <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                        <button 
                            onClick={() => handleDelete(currentItem.id)}
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-all border border-white/10"
                            title="Delete Item (Cmd+Backspace)"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto flex flex-col items-center justify-center">
                        {currentItem.type === 'image' ? (
                            <img src={fullImageMap[currentItem.id] || currentItem.image} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-white/5" alt="" />
                        ) : currentItem.type === 'video' ? (
                            <div className="text-center p-8">
                                <Video className="w-12 h-12 text-blue-500/50 mx-auto mb-4" />
                                <h3 className="text-sm font-bold text-white mb-2">Video Asset</h3>
                                <p className="text-zinc-500 text-[10px] font-mono break-all bg-zinc-900 p-3 rounded-lg border border-white/5">{currentItem.text}</p>
                            </div>
                        ) : (
                            <div className="w-full h-full font-mono text-xs leading-relaxed text-zinc-400 whitespace-pre-wrap selection:bg-blue-500/30 break-words">
                                {currentItem.text}
                            </div>
                        )}
                    </div>
                    <div className="p-2.5 bg-zinc-900 border-t border-white/5 text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em] flex justify-between">
                        <span>{currentItem.type}</span>
                        <span>{currentItem.type === 'image' ? 'IMAGE' : `${currentItem.text?.length} chars`}</span>
                    </div>
                </>
            ) : (
                 <div className="flex flex-1 items-center justify-center text-zinc-700 text-xs font-medium">
                    Select an item to preview
                 </div>
            )}
          </div>
        </div>

        {/* Footer Hints */}
        <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 bg-zinc-900 border border-white/5 rounded min-w-[20px] text-center font-sans">↑↓</kbd> Navigate</span>
                <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 bg-zinc-900 border border-white/5 rounded min-w-[20px] text-center font-sans">↵</kbd> Paste</span>
            </div>
            <button onClick={() => ipcRenderer.send('clear-clipboard-history')} className="hover:text-red-400 transition-colors">
                Clear History
            </button>
        </div>
      </div>
    </ToolLayout>
  );
};

export default ClipboardTool;
