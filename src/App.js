import React, { useState } from 'react';
import { Camera, Video, Clipboard, FileText, Activity } from 'lucide-react';
function App() {
    var _a = useState('home'), activeTab = _a[0], setActiveTab = _a[1];
    var menuItems = [
        { id: 'screenshot', icon: Camera, label: 'Screenshot' },
        { id: 'record', icon: Video, label: 'Record' },
        { id: 'clipboard', icon: Clipboard, label: 'Clipboard' },
        { id: 'notes', icon: FileText, label: 'Notes' },
        { id: 'mindmap', icon: Activity, label: 'Mind Map' },
    ];
    return (<div className="flex flex-col items-center justify-center h-screen w-screen bg-black/40 backdrop-blur-md rounded-xl border border-white/10 p-4 text-white">
      <div className="text-2xl font-bold mb-6 tracking-tight">Buddy</div>
      
      <div className="grid grid-cols-5 gap-4 w-full max-w-2xl">
        {menuItems.map(function (item) { return (<button key={item.id} onClick={function () { return setActiveTab(item.id); }} className="flex flex-col items-center justify-center p-4 rounded-lg bg-white/10 hover:bg-white/20 transition-all hover:scale-105 active:scale-95 group">
            <item.icon className="w-8 h-8 mb-2 text-white/80 group-hover:text-white"/>
            <span className="text-sm font-medium text-white/80 group-hover:text-white">{item.label}</span>
          </button>); })}
      </div>

      <div className="mt-8 text-white/50 text-xs">
        Press Cmd+Shift+A to toggle
      </div>
    </div>);
}
export default App;
