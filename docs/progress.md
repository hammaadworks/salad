# Project Progress & Roadmap

## 1. Core Infrastructure ✅
- [x] **Project Setup:** Initialized with Electron, Vite, React, TypeScript, and Tailwind CSS.
- [x] **Build System:** Configured `npm run dev` (hot-reload) and `npm run build` (production).
- [x] **Main Process:** 
    - [x] Global Shortcut (**Salad Key**: `Cmd+Shift+G` / `Ctrl+Shift+G`) registration.
    - [x] Transparent, frameless window creation.
    - [x] IPC handling for window resizing (`set-fullscreen`).
    - [x] Settings persistence (`settings.json` via `fs`).
- [x] **Renderer Process:** 
    - [x] Basic routing/state management for active tools.

## 2. Main Menu (Launcher) ✅
- [x] **UI:** Floating "Spotlight-style" menu.
- [x] **Features:**
    - [x] Navigation to Screenshot, Record, Clipboard, Notes, Mind Map.
    - [x] **Cursor Tracker:** Real-time X,Y coordinate display.
    - [x] **Color Picker Entry:** UI tile added (logic pending).
    - [x] **Keyboard Navigation:** Arrow keys to select, Enter to open.

## 3. Screenshot Tool 🚧
- [x] **UI Overlay:** Full-screen transparent canvas activation.
- [x] **Selection Logic:** Drag-to-select region functionality.
- [x] **Toolbars:** 
    - [x] Top Toolbar: Mode switcher (Screenshot, Scrollshot, Record, Text).
    - [x] Bottom Toolbar: Contextual editor tools (Shapes, Pen, Save, Copy).
- [ ] **Capture Logic:** Implement `desktopCapturer` to actually take the screenshot of the selected area.
- [ ] **Editor Implementation:** Connect toolbar buttons to canvas drawing functions (Fabric.js or HTML Canvas API).

## 4. Bounding Box Tool 🚧
- [ ] **Backend:** Implement `set-ignore-mouse-events` IPC handler.
- [ ] **Frontend:** Create `BoundingBoxTool` component.
- [ ] **Interaction:** Implement "Hole" strategy (pass-through clicks).
- [ ] **Presets:** Manage default and custom aspect ratios in `settings.json`.
- [ ] **Visibility:** Toggle to Hide/Show boxes for recording.

## 5. Screen Recorder 📝
- [ ] Select region or full screen.
- [ ] Integrate `ffmpeg` for recording and saving.

## 5. Other Features 🚧
- [x] **Mouse Events / Color Picker:** 
    - [x] Global mouse coordinate tracking.
    - [x] Pixel color extraction (HEX/RGB) using Screenshot overlay method.
    - [x] Click to copy values.
- [ ] **Clipboard Manager:** Implement background polling and UI list.
- [x] **Mind Map:** React UI components (`ReactFlow` integration).
- [x] **Quick Notes:** Basic text editor with file-system storage (saves to Desktop as `.txt`).

## 6. Known Issues / To-Dos
- Window resize transition needs smoothing.

