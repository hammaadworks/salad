import React, { useState } from 'react';
import { X, Check, ShieldAlert, Command, Monitor, Clipboard, FileText } from 'lucide-react';

interface TutorialProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "Welcome to Salad",
    description: "Your new all-in-one productivity companion. Let's get you set up.",
    icon: <div className="text-6xl">🥗</div>,
    action: "Next"
  },
  {
    title: "The Magic Key",
    description: "Salad lives in the background. Summon it anytime, from anywhere.",
    icon: (
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2">
            <kbd className="px-3 py-2 bg-zinc-800 rounded-lg border border-zinc-700 font-mono text-xl">Cmd</kbd>
            <span className="text-2xl">+</span>
            <kbd className="px-3 py-2 bg-zinc-800 rounded-lg border border-zinc-700 font-mono text-xl">Shift</kbd>
            <span className="text-2xl">+</span>
            <kbd className="px-3 py-2 bg-zinc-800 rounded-lg border border-zinc-700 font-mono text-xl">G</kbd>
        </div>
        <p className="text-sm text-zinc-400">Command + Shift + G</p>
      </div>
    ),
    action: "Got it"
  },
  {
    title: "Permissions Required",
    description: "To capture screenshots and paste clips, macOS needs your permission.",
    icon: <ShieldAlert className="w-20 h-20 text-yellow-500" />,
    content: (
        <div className="text-left text-sm bg-zinc-800/50 p-4 rounded-lg space-y-2 mt-4 max-w-sm">
            <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-400 mt-0.5" />
                <span><strong>Screen Recording:</strong> Required for the Screenshot tool.</span>
            </div>
            <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-400 mt-0.5" />
                <span><strong>Accessibility:</strong> Required for pasting from Clipboard.</span>
            </div>
        </div>
    ),
    action: "I understand"
  },
  {
    title: "Powerful Tools",
    description: "Everything you need, right at your fingertips.",
    icon: (
        <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center gap-2 p-3 bg-zinc-800/50 rounded-xl">
                <Monitor className="w-6 h-6 text-blue-400" />
                <span className="text-xs">Screenshot</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 bg-zinc-800/50 rounded-xl">
                <Clipboard className="w-6 h-6 text-green-400" />
                <span className="text-xs">History</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 bg-zinc-800/50 rounded-xl">
                <FileText className="w-6 h-6 text-yellow-400" />
                <span className="text-xs">Notes</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 bg-zinc-800/50 rounded-xl">
                <Command className="w-6 h-6 text-purple-400" />
                <span className="text-xs">Shortcuts</span>
            </div>
        </div>
    ),
    action: "Start using Salad"
  }
];

const OnboardingTutorial: React.FC<TutorialProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl w-[500px] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300 relative">
        
        {/* Skip Button */}
        <button 
            onClick={onComplete}
            className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors z-10"
            title="Skip Tutorial"
        >
            <X className="w-5 h-5" />
        </button>

        {/* Progress Bar */}
        <div className="flex h-1 bg-zinc-800">
            {steps.map((_, idx) => (
                <div 
                    key={idx}
                    className={`flex-1 transition-all duration-500 ${idx <= currentStep ? 'bg-green-500' : 'bg-transparent'}`}
                />
            ))}
        </div>

        {/* Content */}
        <div className="p-8 flex flex-col items-center text-center min-h-[400px]">
            <div className="mt-8 mb-6 text-white/90">
                {step.icon}
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-3">{step.title}</h2>
            <p className="text-zinc-400 leading-relaxed mb-6 max-w-sm">{step.description}</p>
            
            {/* Custom Content Slot */}
            {/* @ts-ignore */}
            {step.content}

            <div className="mt-auto pt-8 w-full flex justify-between items-center">
                <div className="flex gap-1">
                    {steps.map((_, idx) => (
                        <div 
                            key={idx} 
                            className={`w-2 h-2 rounded-full transition-colors ${idx === currentStep ? 'bg-white' : 'bg-zinc-700'}`}
                        />
                    ))}
                </div>
                <button 
                    onClick={handleNext}
                    className="px-6 py-2 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transition-colors"
                >
                    {step.action}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTutorial;
