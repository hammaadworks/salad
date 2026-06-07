import { Camera, Clipboard, FileText, Activity, MousePointer2, Box, Timer, Wind, Heart, LucideIcon } from 'lucide-react'
import CaptureTool from './tools/system/CaptureTool'
import ClipboardTool from './tools/system/ClipboardTool'
import QuickNote from './tools/system/QuickNote'
import MindMapTool from './tools/system/MindMapTool'
import FocusTool from './tools/system/FocusTool'
import MouseEventsTool from './tools/system/MouseEventsTool'
import BoundingBoxTool from './tools/system/BoundingBoxTool'
import BreathingTool from './tools/system/BreathingTool'
import TasbeehTool from './tools/system/TasbeehTool'
import TypingGameTool from './tools/system/TypingGameTool'

export interface SaladTool {
  id: string;
  icon: LucideIcon;
  label: string;
  problem: string;
  usage: string;
  component: React.ComponentType<{ onClose: () => void }>;
  fullscreen?: boolean;
  type: 'system' | 'community' | 'user';
  author?: string;
  version?: string;
}

export const ToolRegistry: SaladTool[] = [
  { 
    id: 'capture', 
    icon: Camera, 
    label: 'Capture', 
    problem: 'High-fidelity capture, annotation, and professional recording.',
    usage: 'Snap images or record video. Use the unified toolbar to edit/trim.',
    component: CaptureTool,
    type: 'system'
  },
  { 
    id: 'clipboard', 
    icon: Clipboard, 
    label: 'Clipboard',
    problem: 'Cross-type clipboard history and asset management.',
    usage: 'Browse history (Text & Images). Enter to paste, Cmd+Backspace to delete.',
    component: ClipboardTool,
    type: 'system'
  },
  { 
    id: 'notes', 
    icon: FileText, 
    label: 'Scratchpad',
    problem: 'Markdown-ready scratchpad for transient thoughts.',
    usage: 'Type in Markdown. Press Cmd+S to export a copy to your desktop.',
    component: QuickNote,
    type: 'system'
  },
  { 
    id: 'mindmap', 
    icon: Activity, 
    label: 'Graph',
    problem: 'Visual logic and information mapping.',
    usage: 'Use Tab for children, Enter for siblings. Auto-layouts logic nodes.',
    component: MindMapTool,
    fullscreen: true,
    type: 'system'
  },
  { 
    id: 'focus', 
    icon: Timer, 
    label: 'Focus',
    problem: 'Deep-work orchestration via Pomodoro cycles.',
    usage: 'Standard 25/5 intervals to maintain peak cognitive flow.',
    component: FocusTool,
    type: 'system'
  },
  { 
    id: 'breathing', 
    icon: Wind, 
    label: 'Sanctuary',
    problem: 'Nervous system regulation and mental clarity.',
    usage: 'Select a clinical technique (Box, 4-7-8) and follow the cues.',
    component: BreathingTool,
    fullscreen: true,
    type: 'system'
  },
  { 
    id: 'tasbeeh', 
    icon: Heart, 
    label: 'Remembrance',
    problem: 'Spiritual focus and meditative counting.',
    usage: 'Select a sequence. Tap or Hold to progress through your session.',
    component: TasbeehTool,
    fullscreen: true,
    type: 'system'
  },
  { 
    id: 'mouse-events', 
    icon: MousePointer2, 
    label: 'Inspector',
    problem: 'Real-time coordinate and color inspection.',
    usage: 'Hover to inspect screen data. Click to copy the full data string.',
    component: MouseEventsTool,
    type: 'system'
  },
  { 
    id: 'bounding-box', 
    icon: Box, 
    label: 'Overlay',
    problem: 'Reference frames for content orchestration.',
    usage: 'Spawn presets (9:16, 4:3). Lock ratios to guide your layout.',
    component: BoundingBoxTool,
    fullscreen: true,
    type: 'system'
  },
  {
    id: 'typing-game', 
    icon: Activity, 
    label: 'TypeShift', 
    problem: 'Cognitive reflex and typing speed optimization.',
    usage: 'Process falling data streams before they reach the terminal floor.',
    component: TypingGameTool,
    fullscreen: true,
    type: 'system'
  }
];

export const CommunityRegistry: Omit<SaladTool, 'component'>[] = [
  {
    id: 'json-beautifier',
    icon: FileText,
    label: 'JSON Beautifier',
    problem: 'Messy JSON strings making debugging hard?',
    usage: 'Paste JSON, get instant pretty-print and validation.',
    type: 'community',
    author: 'hammaad',
    version: '1.0.0'
  },
  {
    id: 'color-palette',
    icon: Activity,
    label: 'Palette Gen',
    problem: 'Struggling with accessible color schemes?',
    usage: 'Generate WCAG-compliant palettes from a single seed color.',
    type: 'community',
    author: 'design_pro',
    version: '1.2.0'
  }
];

