import { app, BrowserWindow, globalShortcut, screen, ipcMain, Tray, Menu, nativeImage, desktopCapturer, dialog, clipboard } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { exec } from 'child_process'

// --- Clipboard Manager (Optimized for EIO Errors) ---
let clipboardHistory: { id: string, text?: string, image?: string, fullImage?: string, time: number, type: 'text' | 'image' | 'video' }[] = [];
let lastClipboardText = '';
let lastClipboardImageHash = '';

function startClipboardMonitor() {
  setInterval(() => {
    if (!win || win.isDestroyed() || !win.webContents || win.webContents.isDestroyed()) return;

    // 1. Text/Video Monitor
    try {
        const text = clipboard.readText();
        if (text && text !== lastClipboardText) {
            lastClipboardText = text;
            const isVideo = /\.(mp4|mov|webm|mkv|avi)$/i.test(text.trim());
            const item: any = { id: Date.now().toString(), text, time: Date.now(), type: isVideo ? 'video' : 'text' };
            clipboardHistory = [item, ...clipboardHistory.filter(i => i.text !== text)].slice(0, 20);
            if (!win.webContents.isDestroyed()) {
              win.webContents.send('clipboard-updated', clipboardHistory.map(i => ({...i, fullImage: undefined})));
            }
        }
    } catch (e) {}

    // 2. Image Monitor (Resize thumbnails to prevent IPC bloat)
    try {
        const image = clipboard.readImage();
        if (!image.isEmpty()) {
            const dataUrl = image.toDataURL();
            const hash = dataUrl.slice(-100); 
            if (hash !== lastClipboardImageHash) {
                lastClipboardImageHash = hash;
                // Create a small thumbnail for the list to keep IPC fast and prevent EIO
                const thumbnail = image.resize({ width: 200 }).toDataURL();
                const item: any = { 
                    id: Date.now().toString(), 
                    image: thumbnail, 
                    fullImage: dataUrl, // Keep full res for preview on demand
                    time: Date.now(), 
                    type: 'image' 
                };
                clipboardHistory = [item, ...clipboardHistory].slice(0, 20);
                // Send only the thumbnails to the renderer
                if (!win.webContents.isDestroyed()) {
                  win.webContents.send('clipboard-updated', clipboardHistory.map(i => ({...i, fullImage: undefined})));
                }
            }
        }
    } catch (e) {}
  }, 1500); // Increased interval slightly
}

// --- Settings ---
const SETTINGS_PATH = path.join(app.getPath('userData'), 'settings.json');
const DEFAULT_SETTINGS = {
  globalShortcut: 'CommandOrControl+Shift+G',
  featureShortcuts: { 
    capture: 'CommandOrControl+Shift+1', 
    clipboard: 'CommandOrControl+Shift+2', 
    notes: 'CommandOrControl+Shift+3', 
    focus: 'CommandOrControl+Shift+4',
    breathing: 'CommandOrControl+Shift+5'
  },
  quickNoteSaveLocation: app.getPath('desktop')
};

function loadSettings() {
  try { 
    if (fs.existsSync(SETTINGS_PATH)) {
      const saved = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'));
      return { ...DEFAULT_SETTINGS, ...saved, featureShortcuts: { ...DEFAULT_SETTINGS.featureShortcuts, ...saved.featureShortcuts } };
    } 
  } catch (e) {
    console.error('Failed to load settings', e);
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: any) {
  try { 
    const current = loadSettings();
    const updated = { ...current, ...settings };
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(updated, null, 2)); 
    return updated;
  } catch (e) {
    console.error('Failed to save settings', e);
    return loadSettings();
  }
}

let win: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

function updateTrayMenu() {
    if (!tray) return;
    const settings = loadSettings();
    const mainShortcut = settings.globalShortcut || 'CommandOrControl+Shift+G';
    const featureShortcuts = settings.featureShortcuts || {};
    
    const getAccelerator = (combo: string | undefined) => {
        if (!combo || combo === 'None') return undefined;
        return combo;
    };

    const contextMenu = Menu.buildFromTemplate([
        { label: 'Show Salad Launcher', accelerator: getAccelerator(mainShortcut), click: toggleWindow },
        { type: 'separator' },
        { label: '📸 Capture (Img/Vid)', accelerator: getAccelerator(featureShortcuts.capture), click: () => { toggleWindow(); win?.webContents.send('switch-tab', 'capture'); } },
        { label: '📋 Clipboard History', accelerator: getAccelerator(featureShortcuts.clipboard), click: () => { toggleWindow(); win?.webContents.send('switch-tab', 'clipboard'); } },
        { label: '📝 Quick Notes', accelerator: getAccelerator(featureShortcuts.notes), click: () => { toggleWindow(); win?.webContents.send('switch-tab', 'notes'); } },
        { label: '⏱️ Focus Timer', accelerator: getAccelerator(featureShortcuts.focus), click: () => { toggleWindow(); win?.webContents.send('switch-tab', 'focus'); } },
        { label: '🧠 Mind Map', accelerator: getAccelerator(featureShortcuts.mindmap), click: () => { toggleWindow(); win?.webContents.send('switch-tab', 'mindmap'); } },
        { label: '🌬️ Breathing Tool', accelerator: getAccelerator(featureShortcuts.breathing), click: () => { toggleWindow(); win?.webContents.send('switch-tab', 'breathing'); } },
        { type: 'separator' },
        { label: '⚙️ Settings', click: () => { toggleWindow(); win?.webContents.send('open-settings'); } },
        { type: 'separator' },
        { label: 'Quit Salad', click: () => { isQuitting = true; app.quit(); } }
    ]);
    tray.setContextMenu(contextMenu);
}

function refreshShortcuts() {
    globalShortcut.unregisterAll();
    const settings = loadSettings();
    const failures: string[] = [];
    
    // Register Main Toggle
    if (settings.globalShortcut) {
        try {
            const success = globalShortcut.register(settings.globalShortcut, toggleWindow);
            if (!success) failures.push(settings.globalShortcut);
        } catch (e) {
            console.error(`Failed to register global shortcut: ${settings.globalShortcut}`, e);
            failures.push(settings.globalShortcut);
        }
    }

    // Register Feature Shortcuts
    if (settings.featureShortcuts) {
        Object.entries(settings.featureShortcuts).forEach(([feat, combo]) => {
            if (!combo || combo === 'None') return;
            try {
                const success = globalShortcut.register(combo as string, () => {
                    if (!win) return;
                    win.setSize(800, 600);
                    win.center();
                    win.show();
                    win.focus();
                    win.webContents.send('switch-tab', feat);
                });
                if (!success) failures.push(combo as string);
            } catch (e) {
                console.error(`Failed to register feature shortcut for ${feat}: ${combo}`, e);
                failures.push(combo as string);
            }
        });
    }

    if (failures.length > 0) {
        win?.webContents.send('shortcut-registration-failed', failures);
    }
    
    updateTrayMenu();
}

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(__dirname, '../public')
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  win = new BrowserWindow({
    width: 800, height: 600, icon: path.join(process.env.VITE_PUBLIC || '', 'icon.png'),
    title: 'Salad', frame: false, transparent: true, alwaysOnTop: true, resizable: true, show: false,
    backgroundColor: '#00000000',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), nodeIntegration: true, contextIsolation: false },
  })
  win.center();
  win.webContents.on('did-finish-load', () => win?.webContents.send('settings-loaded', loadSettings()));
  if (VITE_DEV_SERVER_URL) win.loadURL(VITE_DEV_SERVER_URL); else win.loadFile(path.join(process.env.DIST || '', 'index.html'));
  win.on('close', (e) => { if (!isQuitting) { e.preventDefault(); win?.hide(); } return false; });
}

function toggleWindow() {
  if (win) { 
    if (win.isVisible()) {
      win.hide(); 
    } else { 
      const d = screen.getPrimaryDisplay().workAreaSize;
      const width = 600;
      const height = 80;
      win.setSize(width, height);
      win.setPosition(
        Math.floor((d.width - width) / 2),
        Math.floor(d.height * 0.75 - (height / 2))
      );
      win.show(); 
      win.focus(); 
    } 
  }
}

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() });
app.setName('Salad');

// Hide from Dock / Cmd+Tab on macOS for a "Pro Utility" feel
if (process.platform === 'darwin' && app.dock) {
  app.dock.hide();
}

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.hammaadworks.salad');
  }

  createWindow()
  startClipboardMonitor()

  // Standard Quit Shortcut
  globalShortcut.register('CommandOrControl+Q', () => {
    isQuitting = true;
    app.quit();
  });

  win?.on('blur', () => {
    const { width } = win?.getBounds() || { width: 0 };
    if (width < screen.getPrimaryDisplay().workAreaSize.width) win?.hide();
  });

  refreshShortcuts();

  ipcMain.on('register-feature-shortcuts', () => { refreshShortcuts(); });

  // Tray implementation with robust path resolution
  const trayIconPath = path.join(process.env.VITE_PUBLIC || '', 'tray.png');
  let trayIcon = nativeImage.createFromPath(trayIconPath);
  
  if (trayIcon.isEmpty()) {
    // Fallback to a simple circle if icon is missing
    trayIcon = nativeImage.createFromNamedImage('NSStatusAvailable', [0, 0, 0]);
  }

  if (process.platform === 'darwin') {
    trayIcon = trayIcon.resize({ width: 20, height: 20 });
    trayIcon.setTemplateImage(true);
  } else {
    trayIcon = trayIcon.resize({ width: 16, height: 16 });
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('Salad - Productivity OS');
  tray.on('click', toggleWindow);
  updateTrayMenu();


  ipcMain.on('update-shortcut', (event, sc) => { 
    saveSettings({ globalShortcut: sc }); 
    refreshShortcuts();
    event.reply('shortcut-updated', { success: true, shortcut: sc }); 
  });
  
  ipcMain.on('save-settings', (_e, ns) => { 
    saveSettings(ns); 
    if (ns.featureShortcuts || ns.globalShortcut) refreshShortcuts();
  });
  ipcMain.on('get-bounding-boxes', (e) => e.reply('bounding-boxes-loaded', loadSettings().boundingBoxes || []));
  ipcMain.on('save-bounding-boxes', (_e, b) => { const s = loadSettings(); s.boundingBoxes = b; saveSettings(s); });
  
  ipcMain.on('get-clipboard-history', (e) => e.reply('clipboard-history', clipboardHistory.map(i => ({...i, fullImage: undefined}))));
  
  // New: Request full image only when needed for preview
  ipcMain.handle('get-clipboard-full-image', (_e, id) => clipboardHistory.find(i => i.id === id)?.fullImage || null);

  ipcMain.on('delete-clipboard-item', (e, id) => { clipboardHistory = clipboardHistory.filter(i => i.id !== id); e.reply('clipboard-history', clipboardHistory.map(i => ({...i, fullImage: undefined}))); });
  ipcMain.on('clear-clipboard-history', (e) => { clipboardHistory = []; e.reply('clipboard-history', []); });
  ipcMain.on('paste-clipboard-item', (_e, t) => { 
    clipboard.writeText(t); 
    if (process.platform === 'darwin') app.hide(); else win?.hide(); 
    setTimeout(() => { 
      if (!win || win.isDestroyed() || isQuitting) return;
      if (process.platform === 'darwin') exec('osascript -e "tell application \"System Events\" to keystroke \"v\" using command down"'); 
      else if (process.platform === 'win32') exec('powershell -WindowStyle Hidden -Command "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys(\'^v\')"'); 
      else if (process.platform === 'linux') exec('xdotool key ctrl+v'); 
    }, 300); 
  });


  ipcMain.on('save-image', async (e, { dataUrl, custom }) => {
    try {
      const img = nativeImage.createFromDataURL(dataUrl);
      let savePath = custom ? (await dialog.showSaveDialog(win!, { title: 'Save Screenshot', defaultPath: path.join(app.getPath('downloads'), `Salad-${Date.now()}.png`), filters: [{ name: 'Images', extensions: ['png'] }] })).filePath : path.join(app.getPath('downloads'), `Salad-${Date.now()}.png`);
      if (savePath) fs.writeFile(savePath, img.toPNG(), (err) => e.reply('image-saved', { success: !err, path: savePath }));
    } catch (err) {}
  });

  ipcMain.on('copy-image', (_e, { dataUrl }) => { try { clipboard.writeImage(nativeImage.createFromDataURL(dataUrl)); } catch (e) {} });
  ipcMain.on('copy-text', (_e, text) => { try { clipboard.writeText(text); } catch (e) {} });
  ipcMain.on('save-video', async (e, { dataUrl }) => {
    try {
      const { filePath, canceled } = await dialog.showSaveDialog(win!, { title: 'Save Recording', defaultPath: path.join(app.getPath('downloads'), `Salad-${Date.now()}.webm`), filters: [{ name: 'WebM Video', extensions: ['webm'] }] });
      if (!canceled && filePath) fs.writeFile(filePath, Buffer.from(dataUrl.split(',')[1], 'base64'), (err) => e.reply('video-saved', { success: !err, path: filePath }));
    } catch (err) {}
  });

  ipcMain.on('get-settings', (e) => e.reply('settings-loaded', loadSettings()));
  ipcMain.on('save-active-tab', (_e, tab) => {
    saveSettings({ activeTab: tab });
  });
  ipcMain.on('save-pinned-tools', (_e, ids) => {
    saveSettings({ pinnedToolIds: ids });
  });
  ipcMain.handle('select-folder', async () => { const r = await dialog.showOpenDialog(win!, { properties: ['openDirectory'] }); return r.canceled ? null : r.filePaths[0]; });
  ipcMain.on('set-ignore-mouse-events', (e, i, o) => BrowserWindow.fromWebContents(e.sender)?.setIgnoreMouseEvents(i, o));
  ipcMain.handle('get-desktop-source-id', async () => { const d = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()); const s = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 0, height: 0 } }); return s.find(src => src.display_id.toString() === d.id.toString())?.id || s[0]?.id; });
  ipcMain.handle('get-desktop-snapshot-and-hide', async () => { try { const d = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()); const s = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: d.size.width * d.scaleFactor, height: d.size.height * d.scaleFactor }, fetchWindowIcons: false }); const src = s.find(sr => sr.display_id.toString() === d.id.toString()) || s[0]; if (win) win.hide(); return src ? src.thumbnail.toDataURL() : null; } catch (e) { return null; } });
  ipcMain.on('quit-app', () => {
    isQuitting = true;
    app.quit();
  });

  ipcMain.on('set-view-mode', (_e, mode: 'mini' | 'full') => {
    if (win) {
      if (mode === 'mini') {
        const d = screen.getPrimaryDisplay().workAreaSize;
        const width = 600;
        const height = 80;
        win.setSize(width, height);
        win.setPosition(
          Math.floor((d.width - width) / 2),
          Math.floor(d.height * 0.75 - (height / 2))
        );
      } else {
        win.setSize(1000, 700);
        win.center();
      }
    }
  });

  ipcMain.on('hide-window', () => win?.hide());
  ipcMain.on('show-window-and-focus', () => { win?.show(); win?.focus(); });
  ipcMain.handle('capture-screen', async () => {
    // Get ALL screens
    const displays = screen.getAllDisplays();
    const d = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()); 
    if (win) win.hide(); 
    await new Promise(r => setTimeout(r, 150));
    
    const s = await desktopCapturer.getSources({ 
      types: ['screen'], 
      thumbnailSize: { 
        width: d.size.width * d.scaleFactor, 
        height: d.size.height * d.scaleFactor 
      }, 
      fetchWindowIcons: false 
    });
    
    const src = s.find(sr => sr.display_id.toString() === d.id.toString()) || s[0]; 
    return src ? src.thumbnail.toDataURL() : null;
  });
  ipcMain.on('set-fullscreen', (_e, f) => { 
    if (win) { 
      if (f) { 
        // Cover ALL screens seamlessly
        const displays = screen.getAllDisplays();
        const minX = Math.min(...displays.map(d => d.bounds.x));
        const minY = Math.min(...displays.map(d => d.bounds.y));
        const maxX = Math.max(...displays.map(d => d.bounds.x + d.bounds.width));
        const maxY = Math.max(...displays.map(d => d.bounds.y + d.bounds.height));
        
        win.setBounds({ x: minX, y: minY, width: maxX - minX, height: maxY - minY });
        win.setAlwaysOnTop(true, 'screen-saver'); 
        win.show(); 
        win.focus(); 
      } else { 
        win.setSize(800, 600); 
        win.center(); 
        win.setAlwaysOnTop(true, 'floating'); 
      } 
    } 
  });
  ipcMain.on('set-pill-mode', (_e, p) => {
    if (win) {
      if (p) {
        win.setSize(200, 60);
        const d = screen.getPrimaryDisplay().workAreaSize;
        win.setPosition(d.width / 2 - 100, 40);
        win.setAlwaysOnTop(true, 'screen-saver');
      } else {
        win.setSize(800, 600);
        win.center();
        win.setAlwaysOnTop(true, 'floating');
      }
    }
  });
})

app.on('will-quit', () => { globalShortcut.unregisterAll(); isQuitting = true; })
