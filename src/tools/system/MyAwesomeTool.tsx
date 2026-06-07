import { useEffect } from 'react';
import Toolbar from '../../components/Toolbar';
import { Rocket } from 'lucide-react';

interface MyAwesomeToolProps {
  onClose: () => void;
}

export default function MyAwesomeTool({ onClose }: MyAwesomeToolProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose} data-testid="overlay">
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="w-[400px] h-[300px] bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-6 text-white"
      >
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <Rocket className="text-green-500" data-testid="rocket-icon" /> My Awesome Tool
        </h2>
        <p className="text-zinc-400">This is where the magic happens.</p>
        
        <Toolbar onClose={onClose} className="bottom-6 left-1/2 -translate-x-1/2">
            <span className="px-2 text-sm">Custom Toolbar Actions</span>
        </Toolbar>
      </div>
    </div>
  );
}
