import { CommunityRegistry } from '../registry'
import { Search, Download, ExternalLink, User as UserIcon, Package, ShieldCheck, LogIn, Github } from 'lucide-react'
import { useAppStore } from '../store'

export default function CommunityTools() {
  const { user, setUser } = useAppStore()

  const handleLogin = (provider: 'google' | 'github') => {
    const mockEmail = 'user@example.com'
    const existingProvider = localStorage.getItem(`provider_${mockEmail}`)

    if (existingProvider && existingProvider !== provider) {
      alert(`Account Conflict: The email ${mockEmail} is already associated with ${existingProvider}. Please sign in using your original method to prevent duplicate accounts.`)
      return
    }

    // Mock login success
    localStorage.setItem(`provider_${mockEmail}`, provider)
    setUser({
      id: '1',
      name: provider === 'google' ? 'Google User' : 'GitHub Dev',
      email: mockEmail,
      avatar: provider === 'github' ? 'https://github.com/github.png' : undefined,
      provider
    })
  }

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 animate-fade-in">
      <header className="h-20 flex items-center justify-between px-12 shrink-0 border-b border-white/5 bg-zinc-950/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Community Hub</h1>
            <p className="text-xs text-zinc-500 font-medium">Discover and install community-crafted tools</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search tools, authors..." 
              className="w-64 h-11 pl-11 pr-4 bg-white/5 border border-white/5 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
            />
          </div>

          <div className="h-8 w-px bg-white/5" />

          {user ? (
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white">{user.name}</p>
                <p className="text-[10px] text-zinc-500 font-medium capitalize">{user.provider} account</p>
              </div>
              <button 
                onClick={() => setUser(null)}
                className="w-10 h-10 rounded-full border border-white/10 overflow-hidden hover:ring-2 hover:ring-blue-500/50 transition-all"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    {user.name[0]}
                  </div>
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleLogin('github')}
                className="flex items-center gap-2 px-4 h-11 text-[10px] font-bold uppercase tracking-widest text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all"
              >
                <Github className="w-4 h-4" /> GitHub
              </button>
              <button 
                onClick={() => handleLogin('google')}
                className="flex items-center gap-2 px-4 h-11 text-[10px] font-bold uppercase tracking-widest text-zinc-900 bg-white hover:bg-zinc-100 rounded-xl transition-all"
              >
                <LogIn className="w-4 h-4" /> Google
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-8">
              <button className="text-sm font-bold text-white border-b-2 border-blue-500 pb-2">Trending</button>
              <button className="text-sm font-bold text-zinc-500 hover:text-zinc-300 pb-2 transition-colors">Newest</button>
              <button className="text-sm font-bold text-zinc-500 hover:text-zinc-300 pb-2 transition-colors">Verified</button>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5" /> All tools are sandboxed
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CommunityRegistry.map((tool) => (
              <div
                key={tool.id}
                className="group flex flex-col p-6 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-blue-500/30 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 rounded-2xl bg-zinc-950 border border-white/5 text-zinc-400 group-hover:text-blue-500 transition-colors">
                    <tool.icon className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">v{tool.version}</span>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      <UserIcon className="w-3 h-3" /> {tool.author}
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{tool.label}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed mb-8 flex-1">{tool.problem}</p>

                <div className="flex items-center gap-3">
                  <button 
                    disabled
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 text-zinc-500 text-[10px] font-bold uppercase tracking-widest rounded-xl cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" /> Coming Soon
                  </button>
                  <button className="p-3 bg-white/5 text-zinc-500 hover:text-white rounded-xl transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {/* Call to Action Card */}
            <div className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.02] text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center mb-4">
                <Package className="w-6 h-6 text-zinc-600" />
              </div>
              <h3 className="text-sm font-bold text-zinc-300 mb-2">Want to see your tool here?</h3>
              <p className="text-xs text-zinc-500 mb-6">
                {user ? 'Submit your tool to the Salad Community.' : 'Sign in to submit your tool to the community.'}
              </p>
              <button 
                onClick={() => !user && handleLogin('github')}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all"
              >
                {user ? 'Submit Tool' : 'Sign in to Publish'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
