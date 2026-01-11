import { app, BrowserWindow, globalShortcut, screen, ipcMain, Tray, Menu, nativeImage, desktopCapturer, dialog, clipboard } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { exec } from 'child_process'

// --- Clipboard Manager ---
let clipboardHistory: { id: string, text: string, time: number }[] = [];
let lastClipboardText = '';

function startClipboardMonitor() {
  setInterval(() => {
    const text = clipboard.readText();
    if (text && text !== lastClipboardText) {
      lastClipboardText = text;
      const item = {
        id: Date.now().toString(),
        text,
        time: Date.now()
      };
      
      // Add to beginning, remove duplicates if identical text exists
      clipboardHistory = [item, ...clipboardHistory.filter(i => i.text !== text)].slice(0, 40);
      
      // Optional: Notify renderer if window is open
      win?.webContents.send('clipboard-updated', clipboardHistory);
    }
  }, 1000);
}

// --- Settings Persistence Helpers ---
const SETTINGS_PATH = path.join(app.getPath('userData'), 'settings.json');
const DEFAULT_SETTINGS = {
  globalShortcut: 'CommandOrControl+Shift+G',
  quickNoteSaveLocation: app.getPath('desktop')
};

function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      const data = fs.readFileSync(SETTINGS_PATH, 'utf-8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error('Failed to load settings', e);
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: any) {
  try {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

// --- Global Variables ---
let win: BrowserWindow | null = null;
let quickNoteWin: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(__dirname, '../public')
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']


// --- Window Management ---
function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const iconPath = path.join(process.env.VITE_PUBLIC || '', 'icon.png');

  win = new BrowserWindow({
    width: 800,
    height: 600,
    icon: iconPath,
    title: 'Salad',
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  win.center()

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
    // Send current settings to renderer on load
    const settings = loadSettings();
    win?.webContents.send('settings-loaded', settings);
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(process.env.DIST || '', 'index.html'))
  }

  win.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      win?.hide()
    }
    return false
  })
}

function createQuickNoteWindow() {
  if (quickNoteWin && !quickNoteWin.isDestroyed()) {
    quickNoteWin.show();
    quickNoteWin.focus();
    return;
  }

  const iconPath = path.join(process.env.VITE_PUBLIC || '', 'icon.png');

  quickNoteWin = new BrowserWindow({
    width: 300,
    height: 400,
    icon: iconPath,
    title: 'Quick Note',
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    quickNoteWin.loadURL(`${VITE_DEV_SERVER_URL}#/quicknote`);
  } else {
    quickNoteWin.loadFile(path.join(process.env.DIST || '', 'index.html'), { hash: 'quicknote' });
  }
}

function toggleWindow() {
  if (win) {
    if (win.isVisible()) {
      win.hide()
    } else {
      win.setSize(800, 600)
      win.center()
      win.show()
      win.focus()
    }
  }
}

function registerGlobalShortcut(shortcutKey: string) {
  globalShortcut.unregisterAll(); // Clear existing
  try {
    const ret = globalShortcut.register(shortcutKey, toggleWindow);
    if (!ret) {
      console.log('Registration failed for:', shortcutKey);
      return false;
    }
    console.log('Registered shortcut:', shortcutKey);
    return true;
  } catch (err) {
    console.error('Error registering shortcut:', err);
    return false;
  }
}

// --- App Lifecycle ---

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Set App Name explicitly for macOS
app.setName('Salad');

// Hide dock icon on macOS to behave like a background utility
if (process.platform === 'darwin') {
  app.dock?.hide();
}

app.whenReady().then(() => {
  createWindow()
  startClipboardMonitor()

  // Auto-hide on blur (clicking outside)
  win?.on('blur', () => {
    // Check if we are in a "modal" or "fullscreen" state where we might not want to hide?
    // For now, let's assume if it's visible and not in some special state, we hide.
    // However, we need to be careful if the user is interacting with something that steals focus temporarily.
    // But for a Spotlight-like app, standard behavior is to hide.
    // We can check if the window is fullscreen (screenshot mode) - in that case, we might NOT want to hide immediately
    // or maybe we do? If they click a different monitor?
    // Let's rely on a variable or window state.
    const isFullscreen = win?.isFullScreen(); // or check bounds
    // Better: check our own state if we track it, but for now:
    // If the window is massive (covering screen), likely in screenshot mode.
    const { width } = win?.getBounds() || { width: 0 };
    const screenWidth = screen.getPrimaryDisplay().workAreaSize.width;
    
    // Simple heuristic: If width is roughly screen width, we are in fullscreen tool mode.
    // We might NOT want to auto-hide in tool mode if they accidentally click a notification or something?
    // Actually, usually tools capture the whole screen so you can't click "outside".
    // But if multi-monitor... 
    // Let's just hide for now, unless we find it annoying.
    // Safest: Hide if NOT fullscreen.
    if (width < screenWidth) {
       win?.hide();
    }
  });

  // 1. Load Settings & Register Shortcut
  const settings = loadSettings();
  registerGlobalShortcut(settings.globalShortcut);

  // 2. Create Tray Icon
  // Use a dedicated monochrome icon for the tray (better for macOS)
  const trayIconPath = path.join(process.env.VITE_PUBLIC || '', 'tray.png');
  
  let icon = nativeImage.createFromPath(trayIconPath);
    // For macOS tray, icons should be small and template-friendly
    if (process.platform === 'darwin') {
       icon = icon.resize({ width: 22, height: 22 }); // 22x22 is standard for macOS menu bar
       icon.setTemplateImage(true); // This makes it adapt to light/dark mode (monochrome)
  }

  tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Salad', click: toggleWindow },
    { label: 'Quick Note', click: createQuickNoteWindow },
    { type: 'separator' },
    { label: 'Quit', click: () => {
        isQuitting = true;
        app.quit();
      } 
    }
  ]);
  tray.setToolTip('Salad');
  tray.setContextMenu(contextMenu);
  
  // Also open on tray click
  tray.on('click', toggleWindow);

  // 3. Setup IPC for Settings
  ipcMain.on('update-shortcut', (event, newShortcut) => {
    console.log('Updating shortcut to:', newShortcut);
    const success = registerGlobalShortcut(newShortcut);
    if (success) {
      const currentSettings = loadSettings();
      currentSettings.globalShortcut = newShortcut;
      saveSettings(currentSettings);
      event.reply('shortcut-updated', { success: true, shortcut: newShortcut });
    } else {
      event.reply('shortcut-updated', { success: false });
    }
  });

  ipcMain.on('save-settings', (event, newSettings) => {
    const currentSettings = loadSettings();
    const updated = { ...currentSettings, ...newSettings };
    saveSettings(updated);
    // Optionally notify windows?
  });

  // --- Bounding Box Persistence ---
  ipcMain.on('get-bounding-boxes', (event) => {
    const settings = loadSettings();
    event.reply('bounding-boxes-loaded', settings.boundingBoxes || []);
  });

  ipcMain.on('save-bounding-boxes', (event, boxes) => {
    const currentSettings = loadSettings();
    currentSettings.boundingBoxes = boxes;
    saveSettings(currentSettings);
  });

  // --- Clipboard IPC ---
  ipcMain.on('get-clipboard-history', (event) => {
    event.reply('clipboard-history', clipboardHistory);
  });

  ipcMain.on('paste-clipboard-item', (event, text) => {
    clipboard.writeText(text);
    
    // On macOS, hiding the app is more effective for returning focus than hiding the window
    if (process.platform === 'darwin') {
      app.hide();
    } else if (win) {
      win.hide();
    }
    
    // Increased timeout to ensure focus returns to target app before pasting
    setTimeout(() => {
      // Simulate Paste (Cmd+V or Ctrl+V)
      if (process.platform === 'darwin') {
        exec('osascript -e "tell application \\"System Events\\" to keystroke \\"v\\" using command down"');
      } else if (process.platform === 'win32') {
        exec('powershell -WindowStyle Hidden -Command "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys(\'^v\')"');
      } else if (process.platform === 'linux') {
        exec('xdotool key ctrl+v', (error) => {
          if (error) {
            console.warn('xdotool paste failed. Ensure xdotool is installed.', error);
            // Fallback for some Wayland setups (experimental)
            exec('wtype -M ctrl -k v -m ctrl').unref(); 
          }
        });
      }
    }, 300);
  });


  ipcMain.on('save-image', (event, { dataUrl }) => {
    try {
      const img = nativeImage.createFromDataURL(dataUrl);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `Salad-Screenshot-${timestamp}.png`;
      const savePath = path.join(app.getPath('downloads'), filename);
      
      fs.writeFile(savePath, img.toPNG(), (err) => {
        if (err) {
          console.error('Failed to save image:', err);
          event.reply('image-saved', { success: false, error: err.message });
        } else {
          console.log('Image saved to:', savePath);
          // Optional: Show notification
          event.reply('image-saved', { success: true, path: savePath });
          // Reveal in finder/explorer
          // shell.showItemInFolder(savePath); // 'shell' needs import
        }
      });
    } catch (e: any) {
      console.error('Error saving image:', e);
      event.reply('image-saved', { success: false, error: e.message });
    }
  });

  ipcMain.on('copy-image', (event, { dataUrl }) => {
    try {
      const img = nativeImage.createFromDataURL(dataUrl);
      clipboard.writeImage(img);
      event.reply('image-copied', { success: true });
    } catch (e: any) {
      console.error('Error copying image:', e);
      event.reply('image-copied', { success: false, error: e.message });
    }
  });

  ipcMain.on('save-quick-note', (event, content) => {
    const settings = loadSettings();
    const savePath = settings.quickNoteSaveLocation || app.getPath('desktop');
    // Ensure directory exists if possible, but user might have deleted it. 
    // We assume the path is valid.
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `QuickNote-${timestamp}.md`;
    const fullPath = path.join(savePath, filename);

    fs.writeFile(fullPath, content, (err) => {
      if (err) {
        console.error('Failed to save quick note:', err);
        event.reply('quick-note-saved', { success: false, error: err.message });
      } else {
        console.log('Quick note saved to:', fullPath);
        event.reply('quick-note-saved', { success: true, path: fullPath });
        if (quickNoteWin && !quickNoteWin.isDestroyed()) {
          quickNoteWin.close();
        }
      }
    });
  });

  ipcMain.on('get-settings', (event) => {
    event.reply('settings-loaded', loadSettings());
  });

  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(win!, {
      properties: ['openDirectory']
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });



  // --- Mouse Events IPC ---
  ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.setIgnoreMouseEvents(ignore, options);
  });

  ipcMain.handle('get-desktop-snapshot-and-hide', async () => {
    try {
      const currentDisplay = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
      console.log('Main: Current display:', currentDisplay);

      const width = currentDisplay.size.width * currentDisplay.scaleFactor;
      const height = currentDisplay.size.height * currentDisplay.scaleFactor;

      let sources = [];
      try {
        sources = await desktopCapturer.getSources({
          types: ['screen'],
          thumbnailSize: { width, height },
          fetchWindowIcons: false
        });
        console.log('Main: Desktop capturer sources:', sources);
      } catch (captureError: any) {
        console.error('Main: Failed to get sources from desktopCapturer:', captureError);
        throw new Error(`Screen capture permission denied or failed to get sources: ${captureError.message || captureError}`);
      }
      
      if (!sources || sources.length === 0) {
        console.error('Main: No desktop capturer sources found after call.');
        throw new Error('No screen sources found. Ensure screen recording permission is granted for this app.');
      }

      const source = sources.find(s => s.display_id.toString() === currentDisplay.id.toString());
      console.log('Main: Selected source:', source);

      if (win) {
        win.hide();
        console.log('Main: Window hidden.');
      }
      
      if (source) {
        console.log('Main: Returning source thumbnail DataURL.');
        return source.thumbnail.toDataURL();
      } else {
        console.error(`Main: No source found matching current display ID: ${currentDisplay.id}`);
        // Fallback: If specific display source not found, try the first available one
        if (sources.length > 0) {
            console.warn('Main: Falling back to first available desktop capturer source.');
            return sources[0].thumbnail.toDataURL();
        }
        return null;
      }
    } catch (error: any) { // Explicitly type error as 'any' or 'Error'
      console.error('Main: Error in get-desktop-snapshot-and-hide handler:', error);
      throw new Error(`Failed to get desktop snapshot: ${error.message}`); // Re-throw to propagate to renderer
    }
  });

  ipcMain.on('show-window-and-focus', () => {
    if (win) {
      win.show();
      win.focus();
    }
  });

  ipcMain.handle('get-screen-sources', async () => {
    // This handler is now primarily for other tools like ScreenshotTool if it exists.
    // For MouseEventsTool, we use 'get-desktop-snapshot-and-hide'.
    // If this is called while a fullscreen transparent window is active, it might still return the transparent window.
    return await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 0, height: 0 } });
  });
  
  ipcMain.handle('capture-screen', async () => {
    const currentDisplay = screen.getPrimaryDisplay();
    const { width, height } = currentDisplay.bounds; // Capture full size including menu bar
    
    // 1. Hide window to avoid capturing the tool itself
    if (win) win.hide();

    // 2. Small delay to ensure window is hidden
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width, height }, // request full resolution
        fetchWindowIcons: false
      });
      
      const source = sources.find(s => s.display_id.toString() === currentDisplay.id.toString()) || sources[0];
      
      if (!source) {
         throw new Error('No screen source found');
      }

      return source.thumbnail.toDataURL();
    } catch (error) {
      console.error('Failed to capture screen:', error);
      throw error;
    }
  });

  // Existing IPC
  ipcMain.on('set-fullscreen', (event, flag) => {
    if (win) {
      if (flag) {
        // Use bounds of the display where the cursor is
        const cursorPoint = screen.getCursorScreenPoint();
        const display = screen.getDisplayNearestPoint(cursorPoint);
        const { x, y, width, height } = display.bounds;
        
        win.setBounds({ x, y, width, height })
        win.setAlwaysOnTop(true, 'screen-saver') 
        // Ensure it's visible (might have been hidden by capture)
        win.show();
        win.focus();
      } else {
        win.setSize(800, 600)
        win.center()
        win.setAlwaysOnTop(true, 'floating') // Reset to normal 'always on top'
      }
    }
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  isQuitting = true
})
