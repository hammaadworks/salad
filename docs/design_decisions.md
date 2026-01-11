# Design Questions & Decisions

## 1. Video Processing
- **Question:** How to handle video encoding (MP4/GIF) efficiently without bloating the app?
- **Decision:** We will use a statically linked `ffmpeg` binary (via `ffmpeg-static`) executed by the Main process.
- **Reason:** Pure JS encoders are often slow or lack quality settings. `ffmpeg` is the industry standard.

## 2. Data Storage for Notes/Mindmaps
- **Question:** Database (SQLite) or Files (JSON/Markdown)?
- **Decision:** File-based storage.
  - **Quick Notes:** Currently saved as simple `.txt` files to the Desktop for immediate access.
  - **Mind Maps:** Planned to use JSON serialization of the React Flow graph.
- **Reason:** Keeps the app portable and allows users to potentially sync their "Salad Data" folder via Dropbox/Drive/Git if they choose to manually back it up.

## 3. Window Management (The "Overlay" Feel)
- **Question:** How to make it feel like a native overlay?
- **Decision:**
  - The main window will be frameless (`frame: false`) and transparent (`transparent: true`).
  - It will be hidden, not closed, when "dismissed".
  - On macOS, we will hide the dock icon (`app.dock.hide()`) and use a Tray icon instead to keep it unobtrusive.

## 4. Clipboard Monitoring
- **Question:** How to efficiently monitor clipboard changes?
- **Decision:** Polling in the Main process (checking every 1 second or utilizing a native node module like `clipboard-event` if polling proves too resource-intensive).
- **Strategy:** Store only the last 50-100 items to manage memory. Hash content to prevent duplicates.

## 5. UI Library
- **Decision:** `shadcn/ui` + `Tailwind CSS`.
- **Reason:** Provides accessible, unstyled components that we can heavily customize to meet the "aesthetic" requirement without fighting a framework's default look.

## 6. Screenshot Workflow & Window Sizing
- **Question:** How to handle region selection on a "floating menu" app?
- **Decision:**
    - The main window is normally small (800x600).
    - When "Screenshot" is activated, the Renderer sends a `set-fullscreen` IPC message.
    - The Main process resizes the window to cover the *entire* screen (transparently) and sets `alwaysOnTop` to a higher level (`screen-saver` level on macOS) to ensure it overlays everything.
    - When canceled or completed, the window shrinks back to the menu size.
- **Reason:** This avoids creating multiple windows, keeping the state management simple within a single React root.

## 7. Bounding Box Interaction
- **Question:** How to allow users to interact with apps *behind* the bounding box while still resizing/moving the box?
- **Decision:** The "Hole" Strategy.
  - The window is full-screen transparent.
  - Mouse events are ignored (passed through) by default in the center of the box.
  - Mouse events are captured (not ignored) only on the 4px borders and the floating toolbar.
- **Recording Visibility:**
  - Users need to "Hide" the box for the actual recording but "Show" it for setup.
  - **Solution:** A global toggle (Hotkey/Button) to hide/show all active boxes instantly without losing their positions.

## 8. Bounding Box Presets
- **Decision:** Store in `settings.json`.
- **Defaults:** 9:16 (TikTok), 4:5 (Instagram), 1:1 (Square).
- **Custom:** Users can save current dimensions as a new preset.

## 9. Global Color Picking
- **Question:** How to read pixel colors from anywhere on the screen?
- **Decision:** Use the "Snapshot & Overlay" technique (Screen Capture -> Fullscreen Canvas -> Read Canvas Pixel).
- **Alternative Considered:** Native Node.js modules (e.g., `robotjs`, `nut.js`).
- **Reason for Rejection:** Native modules often cause build issues across different OS versions, require recompilation (node-gyp), and can trigger antivirus software. The snapshot approach relies purely on Electron standard APIs (`desktopCapturer`) and standard Web APIs (`Canvas`), ensuring stability and portability.
