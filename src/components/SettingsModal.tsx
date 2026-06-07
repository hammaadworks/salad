import { Clock, Monitor, Keyboard } from 'lucide-react'
import { useAppStore } from '../store'
import { cn } from '../utils'
import ToolLayout from './ToolLayout'

export default function SettingsModal() {
  const { settings, setSettings, setShowSettings } = useAppStore()

  const toggleSetting = (key: keyof typeof settings) => {
    if (typeof settings[key] === 'boolean') {
      setSettings({ ...settings, [key]: !settings[key] })
    }
  }

  const SettingRow = ({ icon: Icon, title, description, checked, onClick }: any) => (
    <div className="flex items-center justify-between p-4 bg-zinc-950 border border-white/5 rounded-xl">
      <div className="flex items-center gap-4">
        <div className="p-2.5 rounded-lg bg-zinc-900 border border-white/5 text-zinc-500">
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-100">{title}</p>
          <p className="text-xs text-zinc-500">{description}</p>
        </div>
      </div>
      <button 
        onClick={onClick}
        className={cn(
          "w-10 h-5.5 rounded-full transition-all duration-300 relative p-1 border border-white/10",
          checked ? "bg-blue-600 border-blue-500" : "bg-zinc-800"
        )}
      >
        <div className={cn(
          "w-3.5 h-3.5 rounded-full transition-all duration-300 bg-white shadow-sm",
          checked ? "translate-x-4.5" : "translate-x-0"
        )} />
      </button>
    </div>
  )

  return (
    <ToolLayout title="Settings" onClose={() => setShowSettings(false)} isModal className="w-[480px]">
      <div className="space-y-6">
        <section>
          <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">General</h4>
          <div className="space-y-2">
            <SettingRow 
              icon={Clock}
              title="Auto Hide Launcher"
              description="Close launcher after tool selection"
              checked={settings.autoHide}
              onClick={() => toggleSetting('autoHide')}
            />
            <SettingRow 
              icon={Monitor}
              title="Launch at Login"
              description="Start Salad automatically on startup"
              checked={settings.startOnLogin}
              onClick={() => toggleSetting('startOnLogin')}
            />
          </div>
        </section>

        <section>
          <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Shortcuts</h4>
          <div className="p-4 bg-zinc-950 border border-white/5 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-lg bg-zinc-900 border border-white/5 text-zinc-500">
                  <Keyboard className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-100">Global Launcher</p>
                  <p className="text-xs text-zinc-500">Trigger key for the launcher</p>
                </div>
              </div>
              <div className="flex gap-1">
                {settings.shortcut.split('+').map((key, i) => (
                  <kbd key={i} className="px-2 py-1 bg-zinc-900 border border-white/10 rounded-md text-[10px] font-bold text-zinc-400 font-sans shadow-sm">
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          </div>
        </section>

        <button 
          onClick={() => setShowSettings(false)}
          className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-3 rounded-lg mt-4 transition-all active:scale-[0.98] text-xs uppercase tracking-widest"
        >
          Close Settings
        </button>
      </div>
    </ToolLayout>
  )
}
