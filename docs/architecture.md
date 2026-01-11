# System Architecture

## 1. Technology Stack Selection

### Core Framework: Electron
- **Reasoning:** Electron provides the most robust set of APIs for desktop integration (global shortcuts, native menus, tray icons, screen capture) while allowing us to use modern web technologies for complex UIs (mind maps, editors).

### Frontend Framework: React + TypeScript
- **Reasoning:** Strong ecosystem for the required complex components:
  - `react-flow` for Mind Maps.
  - `fabric.js` or `react-sketch-canvas` for Image Editing.
  - Rich text editors (e.g., TipTap/Slate).
- **Styling:** Tailwind CSS + Shadcn UI (or Framer Motion) for high-quality aesthetics and animations.

### Build Tooling: Vite
- **Reasoning:** Fast HMR (Hot Module Replacement) and optimized builds.

### State Management: Zustand
- **Reasoning:** Lightweight and simple, perfect for managing UI state and ephemeral data like clipboard history in memory before persistence.

### Data Persistence: Native Node.js `fs`
- **Implementation:** 
  - **Settings:** Stored in `settings.json` in the user data directory.
  - **Quick Notes:** Saved as `.txt` files to the user's Desktop (or configured path).
  - **Note:** `electron-store` is included in dependencies but currently the Main process uses `fs` directly for file operations.

## 2. High-Level Architecture

### Main Process (Node.js)
- **Responsibilities:**
  - Application lifecycle management.
  - Registration of Global Shortcuts (`globalShortcut` API).
  - Native window management (creating the overlay, setting `alwaysOnTop`).
  - System interaction: Accessing clipboard, file system, and screen capture sources (`desktopCapturer`).
  - Handling inter-process communication (IPC).

### Renderer Process (React UI)
- **Responsibilities:**
  - Rendering the UI components.
  - Handling user input.
  - Running the logic for editors (image/video), mind maps, and note-taking.
  - Communicating with Main Process via `contextBridge` / `ipcRenderer`.

### IPC Strategy (Inter-Process Communication)
- **Main -> Renderer:** Trigger "Show Salad", "Update Clipboard History".
- **Renderer -> Main:** "Save File", "Resize Window", "Hide Menu", "Exec System Command", "Set Ignore Mouse Events".

### 4. Interactive Overlay Strategy ("The Hole")
- **Problem:** Need to draw bounding boxes on top of other apps while still allowing users to interact with the content *inside* the box.
- **Solution:** `win.setIgnoreMouseEvents(ignore, { forward: true })`.
  - **Renderer Logic:** Detects if mouse is over a UI element (border/toolbar) or empty space.
  - **IPC:** Sends `set-ignore-mouse-events(true, { forward: true })` when hovering empty space (Click-Through).
  - **IPC:** Sends `set-ignore-mouse-events(false)` when hovering UI (Interactive).

## 5. Mouse Events / Color Picker Strategy

### The Challenge
Web pages (Renderer process) cannot access pixel data outside their own window due to security sandboxing. To implement a "Global Color Picker," we cannot simply ask the OS for the color at (x, y).

### The Solution: "Snapshot & Overlay"
1. **Capture:** When the tool is activated, the Main process captures a high-resolution snapshot of the current screen using `desktopCapturer`.
   - *Critical Detail:* We must multiply the screen dimensions by the `scaleFactor` to ensure pixel-perfect accuracy on Retina/High-DPI displays.
2. **Overlay:** The Main process sends this image to the Renderer and sets the window to **Full Screen** (covering the real desktop).
3. **Simulation:** The Renderer draws this snapshot onto a hidden `<canvas>`.
4. **Interaction:** As the user moves their mouse, we track coordinates on the overlay.
   - We map the CSS coordinates (e.g., 500px) to the physical image coordinates (e.g., 1000px on 2x scale).
   - We use `ctx.getImageData()` to read the RGB values from the canvas.
5. **Result:** To the user, it looks like they are hovering over their actual desktop, but they are technically hovering over a static screenshot inside our app.

## 3. Component Diagram

```mermaid
graph TD
    User((User)) -->|Cmd+Shift+G (Salad Key)| GlobalShortcut[Main Process: Global Shortcut Handler]
    GlobalShortcut -->|IPC| WindowMgr[Main Process: Window Manager]
    WindowMgr -->|Show| MainWindow[Renderer: Main Menu Overlay]
    
    subgraph "Renderer Process"
        MainWindow --> Router{Feature Router}
        Router --> Screenshot[Screenshot & Edit]
        Router --> Recorder[Video Recorder & Edit]
        Router --> Clipboard[Clipboard Manager]
        Router --> Notes[Quick Notes]
        Router --> MindMap[Mind Map Canvas]
    end
    
    Clipboard -->|Read/Write| SysClip[System Clipboard]
    Screenshot -->|Get Sources| DesktopCap[Main: DesktopCapturer]
    Notes -->|Save| LocalStore[Local File System / DB]
```
