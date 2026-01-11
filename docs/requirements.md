# Salad - Project Requirements

## 1. Overview
"Salad" is a universal, cross-platform desktop utility designed to boost productivity. It is triggered via a configurable global hotkey (the **Salad Key**, default: `Cmd+Shift+G` or `Ctrl+Shift+G`), launching a sleek, aesthetic menu that provides quick access to essential tools.

## 2. Target Platforms
- macOS
- Windows
- Linux

## 3. Core Features

### 3.1 Global Shortcut & Overlay Menu
- **Trigger:** Configurable global keyboard shortcut (The **Salad Key**).
- **UI:** A floating, centralized, or spotlight-style menu (similar to Raycast/Alfred/Spotlight).
- **Aesthetics:** Modern, visually appealing interface (blur effects, animations, dark/light mode support).

### 3.2 Screenshot Tool
- Capture the entire screen, a specific window, or a selected region.
- **Built-in Editor:**
  - Crop, resize.
  - Annotation tools (arrows, text, shapes, blur/pixelate sensitive info).
  - Copy to clipboard or save to disk.

### 3.3 Screen Recorder
- Record full screen or selected region.
- **Formats:** Export as MP4 or high-quality GIF.
- **Editor:**
  - Trim start/end.
  - Crop dimensions.
- Audio recording support (system audio + microphone).

### 3.4 Clipboard Manager
- History of copied text, images, and links.
- Search functionality.
- Pin frequently used items.
- "Paste as plain text" option.

### 3.5 Quick Notes
- Rich text support (Markdown preferred).
- Auto-saving.
- Organization via tags or folders.
- Floating "sticky note" mode.

### 3.6 Mind Map Diagramming
- Visual canvas for creating mind maps.
- Drag-and-drop nodes.
- Export as image (PNG/SVG).

## 4. Non-Functional Requirements
- **Performance:** Low memory footprint when running in background.
- **Responsiveness:** Instant startup upon shortcut press.
- **Privacy:** All data stored locally on the user's machine.
- **Update Mechanism:** Auto-update capability.

## 5. UI/UX Guidelines
- Minimalist design.
- Keyboard-first navigation:
  - Global shortcut to open/close.
  - Number keys (1-9) for the first 9 menu items.
  - Letter keys (A-Z) for subsequent menu items.
  - Escape to go back/close.
- Smooth transitions and animations.


