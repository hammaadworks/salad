import React, { useState, useEffect, useRef } from 'react';
import { ipcRenderer } from 'electron';
import { X } from 'lucide-react';

interface MouseEventsToolProps {
  onClose: () => void;
}

const MouseEventsTool: React.FC<MouseEventsToolProps> = ({ onClose }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hexColor, setHexColor] = useState('#000000');
  const [rgbColor, setRgbColor] = useState('rgb(0, 0, 0)');
  const [isReady, setIsReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const requestRef = useRef<number | undefined>(undefined);
  const lastEventRef = useRef<React.MouseEvent | null>(null);

  const update = () => {
    if (lastEventRef.current && isReady && canvasRef.current) {
        const e = lastEventRef.current;
        const x = e.clientX;
        const y = e.clientY;
        
        setMousePos({ x, y });

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true }); // Optimize for frequent reads
        if (ctx) {
            // Map client coordinates (CSS pixels) to Canvas coordinates (Physical pixels)
            // Use window.screen.width/height to match the full desktop screenshot dimensions
            const scaleX = canvas.width / window.screen.width;
            const scaleY = canvas.height / window.screen.height;
            
            const pixelX = Math.floor(x * scaleX);
            const pixelY = Math.floor(y * scaleY);

            const pixel = ctx.getImageData(pixelX, pixelY, 1, 1).data;
            const r = pixel[0], g = pixel[1], b = pixel[2];
            
            const hex = '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('').toUpperCase();
            const rgb = `rgb(${r}, ${g}, ${b})`;
            
            setHexColor(hex);
            setRgbColor(rgb);
        }
    }
    requestRef.current = undefined;
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
      // Synthetic events are reused in React, so we must persist it or clone the properties we need.
      // Actually, since we only need clientX/Y, let's just store those or use the event if we use standard DOM event.
      // But this is React event. Cloning or storing simple obj is safer.
      // Let's store a simple object to avoid React event pooling issues (though pooling is gone in React 17+, better safe)
      // Wait, we can't store React.MouseEvent in ref effectively if we want to access it later async.
      // We'll construct a mock object.
      lastEventRef.current = { ...e, clientX: e.clientX, clientY: e.clientY } as any;

      if (!requestRef.current) {
          requestRef.current = requestAnimationFrame(update);
      }
  };

  useEffect(() => {
      return () => {
          if (requestRef.current) cancelAnimationFrame(requestRef.current);
      }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        // 1. Capture screen (hides window automatically)
        const dataURL = await ipcRenderer.invoke('get-desktop-snapshot-and-hide');
        
        if (!isMounted) return;

        if (dataURL) {
          const img = new Image();
          img.onload = () => {
            if (!isMounted) return;
            const canvas = canvasRef.current;
            if (canvas) {
              // Set canvas to actual image dimensions (often 2x for Retina)
              canvas.width = img.width;
              canvas.height = img.height;
              
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0, img.width, img.height);
                setIsReady(true);
                
                // 2. Now show the window in fullscreen mode
                ipcRenderer.send('set-fullscreen', true);
              }
            }
          };
          img.src = dataURL;
        } else {
          console.error("Failed to get desktop snapshot.");
          onClose();
        }
      } catch (e) {
        console.error("Error loading snapshot:", e);
        onClose();
      }
    };

    init();

    return () => {
      isMounted = false;
      // Reset window state on unmount
      ipcRenderer.send('set-fullscreen', false);
      // Ensure we go back to normal window mode/visibility is handled by set-fullscreen(false) which usually centers and shows
    };
  }, [onClose]);

  // handleMouseMove is now defined above with rAF logic

  const handleClick = () => {
    const text = `X: ${mousePos.x}, Y: ${mousePos.y}, HEX: ${hexColor}, RGB: ${rgbColor}`;
    navigator.clipboard.writeText(text);
    // Visual feedback could be added here
    onClose();
  };

  return (
    <div 
        className="fixed inset-0 z-50 bg-transparent cursor-crosshair"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
    >
      {/* Hidden canvas holding the screenshot */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Info Box */}
      {isReady && (
        <div 
          className="fixed pointer-events-none z-[60] bg-zinc-900/90 backdrop-blur-md border border-white/10 p-3 rounded-lg shadow-2xl text-xs text-white min-w-[150px]"
          style={{ 
              left: Math.min(mousePos.x + 20, window.innerWidth - 180), 
              top: Math.min(mousePos.y + 20, window.innerHeight - 150),
          }}
        >
          <div className="grid grid-cols-[40px_1fr] gap-2 items-center">
              <span className="text-zinc-400 font-medium">Pos</span>
              <span className="font-mono text-right">{mousePos.x}, {mousePos.y}</span>
              
              <span className="text-zinc-400 font-medium">HEX</span>
              <div className="flex items-center justify-end gap-2">
                  <div 
                      className="w-3 h-3 rounded-sm border border-white/20 shadow-sm" 
                      style={{ backgroundColor: hexColor }} 
                  />
                  <span className="font-mono">{hexColor}</span>
              </div>

              <span className="text-zinc-400 font-medium">RGB</span>
              <span className="font-mono text-right">{rgbColor}</span>
          </div>
          <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-zinc-500 text-center">
              Click to Copy & Exit
          </div>
        </div>
      )}

      {/* Exit Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="fixed top-4 right-4 p-2 bg-black/50 hover:bg-red-500 rounded-full text-white transition-colors cursor-pointer z-[70] pointer-events-auto"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export default MouseEventsTool;
