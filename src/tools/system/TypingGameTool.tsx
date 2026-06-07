import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Trophy, Target, Zap, ShieldAlert, Play, RotateCcw } from 'lucide-react';
import { cn } from '../../utils';

interface FallingWord {
  id: number;
  text: string;
  x: number;
  y: number;
  speed: number;
  color: string;
  isPerfect?: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const WORD_BANK = [
  'system', 'kernel', 'root', 'sudo', 'grep', 'bash', 'react', 'async', 'await', 
  'binary', 'buffer', 'cipher', 'daemon', 'debug', 'encode', 'fetch', 'git', 
  'header', 'index', 'json', 'log', 'matrix', 'node', 'packet', 'query', 'stack'
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export default function TypingGameTool({ onClose }: { onClose: () => void }) {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [words, setWords] = useState<FallingWord[]>([]);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [health, setHealth] = useState(100);
  const [particles, setParticles] = useState<Particle[]>([]);
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const spawnWord = useCallback(() => {
    const text = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
    const x = 10 + Math.random() * 80;
    const speed = 0.15 + (level * 0.05) + Math.random() * 0.1;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    setWords(prev => [...prev, { id: Date.now() + Math.random(), text, x, y: -5, speed, color }]);
  }, [level]);

  const createParticles = (x: number, y: number, color: string) => {
    const newParticles = Array.from({ length: 12 }).map((_, i) => ({
      id: Date.now() + i,
      x,
      y,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      life: 1.0,
      color
    }));
    setParticles(prev => [...prev, ...newParticles]);
  };

  // Game Loops
  useEffect(() => {
    if (gameState !== 'playing') return;

    const spawnInterval = setInterval(spawnWord, Math.max(600, 2000 - (level * 200)));
    const gameLoop = setInterval(() => {
      setWords(prev => {
        const next = prev.map(w => ({ ...w, y: w.y + w.speed }));
        const failed = next.filter(w => w.y >= 90);
        
        if (failed.length > 0) {
          setHealth(h => {
            const newHealth = h - (failed.length * 10);
            if (newHealth <= 0) {
              setGameState('gameover');
              return 0;
            }
            return newHealth;
          });
          setCombo(0);
        }
        
        return next.filter(w => w.y < 90);
      });

      setParticles(prev => prev
        .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - 0.05 }))
        .filter(p => p.life > 0)
      );
    }, 30);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(gameLoop);
    };
  }, [gameState, level, spawnWord]);

  useEffect(() => {
    setLevel(Math.floor(score / 500) + 1);
  }, [score]);

  useEffect(() => {
    if (combo > maxCombo) setMaxCombo(combo);
  }, [combo, maxCombo]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase();
    setInput(val);
    
    const matchedIdx = words.findIndex(w => w.text === val);
    if (matchedIdx !== -1) {
      const word = words[matchedIdx];
      const points = 50 + (combo * 10);
      setScore(s => s + points);
      setCombo(c => c + 1);
      createParticles(word.x, word.y, word.color);
      setWords(prev => prev.filter((_, i) => i !== matchedIdx));
      setInput('');
    }
  };

  const startGame = () => {
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setHealth(100);
    setLevel(1);
    setWords([]);
    setParticles([]);
    setGameState('playing');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-zinc-950 text-white font-mono overflow-hidden select-none">
      {/* HUD Header */}
      <header className="absolute top-0 left-0 right-0 h-20 px-12 flex items-center justify-between border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl z-50">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Score</p>
              <p className="text-xl font-black text-white italic">{score.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Level</p>
              <p className="text-xl font-black text-white italic">{level}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Combo</p>
              <p className="text-xl font-black text-white italic">x{combo}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="w-64">
            <div className="flex justify-between items-end mb-2">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Integrity</p>
              <p className={cn("text-xs font-bold italic", health < 30 ? "text-red-500 animate-pulse" : "text-emerald-500")}>{health}%</p>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div 
                className={cn("h-full transition-all duration-300", health < 30 ? "bg-red-500" : "bg-emerald-500")}
                style={{ width: `${health}%` }}
              />
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>
      </header>

      {/* Game Stage */}
      <main className="relative h-full w-full pt-20" ref={gameAreaRef}>
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />

        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm z-40">
            <div className="w-20 h-20 rounded-3xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(59,130,246,0.2)]">
              <Zap className="w-10 h-10 text-blue-500" />
            </div>
            <h1 className="text-6xl font-black italic tracking-tighter text-white mb-4">TYPESHIFT</h1>
            <p className="text-zinc-500 mb-12 max-w-md text-center leading-relaxed font-sans">
              Protect the terminal from incoming data streams. Type the falling words correctly to maintain system integrity.
            </p>
            <button 
              onClick={startGame}
              className="group relative px-12 py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl transition-all active:scale-95 shadow-[0_20px_40px_rgba(37,99,235,0.3)]"
            >
              <div className="flex items-center gap-3">
                <Play className="w-5 h-5 text-white" />
                <span className="text-sm font-black uppercase tracking-[0.2em] text-white">Initialize Protocol</span>
              </div>
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/90 backdrop-blur-md z-40">
            <ShieldAlert className="w-20 h-20 text-red-500 mb-8 animate-bounce" />
            <h1 className="text-6xl font-black italic tracking-tighter text-white mb-2">SYSTEM BREACH</h1>
            <p className="text-red-300/60 mb-12 uppercase tracking-[0.3em] font-bold">Integrity Compromised</p>
            
            <div className="grid grid-cols-2 gap-4 mb-12 w-full max-w-sm">
              <div className="p-6 rounded-2xl bg-black/40 border border-white/5 text-center">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Final Score</p>
                <p className="text-2xl font-black text-white italic">{score.toLocaleString()}</p>
              </div>
              <div className="p-6 rounded-2xl bg-black/40 border border-white/5 text-center">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Max Combo</p>
                <p className="text-2xl font-black text-white italic">x{maxCombo}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={startGame}
                className="px-10 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-200 transition-all active:scale-95 flex items-center gap-3"
              >
                <RotateCcw className="w-4 h-4" /> Try Again
              </button>
              <button 
                onClick={onClose}
                className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all active:scale-95"
              >
                Exit Terminal
              </button>
            </div>
          </div>
        )}

        {/* Particles */}
        {particles.map(p => (
          <div 
            key={p.id}
            className="absolute w-1.5 h-1.5 rounded-full pointer-events-none z-10"
            style={{ 
              left: p.x, 
              top: p.y, 
              backgroundColor: p.color,
              opacity: p.life,
              transform: `scale(${p.life})`
            }}
          />
        ))}

        {/* Falling Words */}
        {words.map((w) => (
          <div 
            key={w.id} 
            className="absolute transform -translate-x-1/2 transition-all duration-300 ease-linear pointer-events-none"
            style={{ left: `${w.x}%`, top: `${w.y}%` }}
          >
            <div 
              className="px-6 py-2 rounded-xl border border-white/10 bg-zinc-900/40 backdrop-blur-sm shadow-2xl relative group"
              style={{ borderColor: `${w.color}40` }}
            >
              <div className="absolute inset-0 bg-current opacity-[0.03] rounded-xl" style={{ color: w.color }} />
              <p className="text-2xl font-black italic tracking-tight uppercase" style={{ color: w.color }}>
                {w.text}
              </p>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-full h-[2px] overflow-hidden rounded-full bg-white/5">
                 <div className="h-full bg-current transition-all duration-300" style={{ color: w.color, width: '100%' }} />
              </div>
            </div>
          </div>
        ))}

        {/* Input Area */}
        {gameState === 'playing' && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-full max-w-xl px-6">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-3xl blur opacity-20 group-focus-within:opacity-40 transition-opacity duration-500" />
              <input 
                ref={inputRef}
                autoFocus
                type="text" 
                value={input} 
                onChange={handleInput}
                className="relative w-full bg-zinc-900/90 border border-white/10 p-8 rounded-2xl text-center text-4xl font-black italic tracking-tighter text-white placeholder:text-zinc-800 outline-none focus:border-blue-500/50 transition-all backdrop-blur-xl shadow-2xl"
                placeholder="EXECUTE PROTOCOL..."
              />
              <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-300" style={{ width: `${(input.length / 10) * 100}%` }} />
            </div>
            <div className="mt-6 flex justify-center gap-4">
              <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/5">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" /> Encryption Active
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Terminal Secure
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer System Status */}
      <footer className="absolute bottom-6 left-12 right-12 flex justify-between items-center pointer-events-none">
        <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-[0.5em]">Sector 7G-Alpha // Terminal-Ready</p>
        <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-[0.5em]">V-2.0.4-Stable</p>
      </footer>
    </div>
  );
}
