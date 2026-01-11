# Salad User Guide 🥗

Welcome to **Salad**, your new all-in-one productivity companion. This guide will help you get set up, configure necessary permissions, and master the tools at your fingertips.

## 🚀 Getting Started

### 1. Installation
- **macOS:** Download the `.dmg` file, open it, and drag "Salad" to your Applications folder.
- **Windows:** Download and run the `.exe` installer.
- **Linux:** Download the `.AppImage`, make it executable (`chmod +x Salad.AppImage`), and run it.

### 2. The "Salad Key"
The most important thing to remember is the **Global Shortcut**:
- **Mac:** `Cmd + Shift + G`
- **Windows/Linux:** `Ctrl + Shift + G`

Pressing this key combination will toggle the Salad menu from *anywhere* on your computer.

**Navigation:**
Once open, you can:
- Use **Arrow Keys** to highlight a tool and press **Enter**.
- Press the corresponding **Number Key** (1-9) or **Letter** (A-Z) for instant access.

---

## ⚠️ Important: Permissions (macOS)

To provide features like **Screenshots** and **Global Shortcuts**, Salad needs specific system permissions. macOS requires you to explicitly grant these.

### 1. Screen Recording Permission
**Required for:** The Screenshot Tool to capture your screen.
- **Why?** Without this, the screenshot tool will either show a black screen or fail to capture anything.
- **How to enable:**
    1. Open **System Settings**.
    2. Go to **Privacy & Security** > **Screen Recording**.
    3. Find **Salad** in the list and toggle the switch to **ON**.
    4. You may be asked to restart the app. Please quit and relaunch Salad.

### 2. Accessibility Permission (Optional but Recommended)
**Required for:** Reliable Global Shortcuts and pasting from Clipboard History.
- **Why?** This allows Salad to "press" keys (like `Cmd+V`) on your behalf when you select an item from your history.
- **How to enable:**
    1. Open **System Settings**.
    2. Go to **Privacy & Security** > **Accessibility**.
    3. Find **Salad** and toggle it **ON**.

---

## 🛠 Feature Walkthrough

### 📋 Clipboard History
*Never lose a copied link again.*
- **Access:** Open Salad and click **Clipboard** (or press the corresponding number key).
- **Navigation:** Use `Left` / `Right` arrow keys to browse previous clips.
- **Paste:** Press `Enter` to paste the selected clip into your active app.
- **Detail View:** Large text is scrollable so you can read before you paste.

### 📸 Screenshot Tool
*Capture, Edit, Save.*
- **Access:** Select **Screenshot** from the menu.
- **Capture:** Click and drag to select an area.
- **Edit:** Use the toolbar to draw arrows, add text, or highlight areas.
- **Action:**
    - `Double Click` selection: Copy to Clipboard.
    - `Save Icon`: Save to your Downloads folder.
    - `Esc`: Cancel.

### 📝 Quick Notes
*Jot down thoughts instantly.*
- **Access:** Select **Quick Note**.
- **Usage:** Type away! Your notes are automatically saved to a text file on your Desktop (configurable).
- **Tip:** Great for scratchingpads during meetings.

### 🧠 Mind Map
*Visualize your ideas.*
- **Access:** Select **Mind Map**.
- **Usage:** Drag nodes from the sidebar onto the canvas. Connect them to build flows.

### 🖱️ Mouse Events & Color Picker
*Inspect pixels anywhere on your screen.*
- **Access:** Select **Mouse Events** (or press `6`).
- **Function:** 
    - The tool takes a quick snapshot of your screen.
    - Move your mouse to inspect **X, Y coordinates** and **Color Values** (HEX & RGB).
- **Action:**
    - `Click` anywhere to **Copy** the data string to your clipboard and close the tool.
    - `Esc` or `Click X` to close without copying.

---

## ❓ Troubleshooting

**Q: The Global Shortcut isn't working.**
A: Check if another app is using `Cmd+Shift+G`. You can change the shortcut in `settings.json` (feature coming to UI soon). Also, ensure Accessibility permissions are granted.

**Q: Screenshots are blank.**
A: This is 99% a permission issue on macOS. Please review the "Screen Recording Permission" section above.

**Q: The app disappeared!**
A: Salad is designed to be unobtrusive. Check your System Tray (top bar on Mac, bottom right on Windows). You can click the salad icon there to open it or Quit.
