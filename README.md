# Salad 🥗

> Your aesthetic, all-in-one desktop productivity companion.

Salad is a cross-platform (macOS, Windows, Linux) desktop utility built with **Electron**, **React**, and **TypeScript**. It provides a suite of tools like a Screenshot Editor, Screen Recorder, Clipboard Manager, and more, all accessible via a single global shortcut (the **Salad Key**).

## 📥 Download

Get the latest version for macOS, Windows, and Linux at:
**[hammaadworks.com/salad](https://hammaadworks.com/salad)**

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/salad.git
   cd salad
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run in Development Mode:**
   ```bash
   npm run dev
   ```
   - This starts the Vite dev server and the Electron main process.
   - **Trigger:** Press `Cmd+Shift+G` (Mac) or `Ctrl+Shift+G` (Win/Linux) to toggle the menu (The **Salad Key**).

4. **Build for Production:**
   ```bash
   npm run build
   ```

5. **Package Application:**
   ```bash
   npm run package
   ```
   - This builds the executable installers (DMG, Exe, AppImage) into the `release` folder.

## 🏗 Project Structure

```
salad/
├── docs/                 # Requirements, Architecture, Design Decisions
├── electron/             # Electron Main Process Code
│   ├── main.ts           # App lifecycle, shortcuts, window management
│   └── preload.ts        # Context bridge (if needed later)
├── src/                  # React Renderer Code
│   ├── components/       # Reusable UI components
│   │   └── ScreenshotTool.tsx  # The screenshot overlay & editor UI
│   ├── App.tsx           # Main Launcher Menu
│   ├── main.tsx          # React Entry point
│   └── index.css         # Tailwind global styles
├── dist/                 # Built assets (Renderer)
├── dist-electron/        # Built assets (Main)
└── package.json
```

## 🛠 Key Commands

- `npm run dev`: Start the app with Hot Module Replacement (HMR).
- `npm run build`: Type-check and build both Main and Renderer processes.
- `npm run preview`: Preview the production build.
- `npm run package`: Build the standalone executable/installer.

## 🤝 Contributing

### Adding a New Feature
1. **Define Requirements:** Check `docs/requirements.md` to see what is planned.
2. **Update Architecture:** If introducing new native modules, document it in `docs/architecture.md`.
3. **Create Component:** Add your tool in `src/components/`.
4. **Register in Menu:** Update `src/App.tsx` to add a new tile for your tool.
5. **Handle Routing:** Use the `activeTab` state in `App.tsx` to switch to your component view.

### Style Guide
- **Styling:** Use Tailwind CSS classes.
- **Icons:** Use `lucide-react`.
- **State:** Use local React state for simple UI, `zustand` for global app state.
- **IPC:** Use `ipcRenderer.send()` for one-way messages to Main, and `ipcRenderer.invoke()` for async data fetching.

## 📝 Documentation
- [Requirements](docs/requirements.md)
- [Architecture](docs/architecture.md)
- [Design Decisions](docs/design_decisions.md)
- [Progress Log](docs/progress.md)

---
*Built with ❤️ by the Salad Team.*
