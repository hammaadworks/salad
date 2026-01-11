# Deployment & Packaging Wiki

This guide documents the process for packaging the **Salad** application for production and deploying the landing page to the live website.

## 1. Packaging the Application

We use `electron-builder` to create standalone installers for macOS, Windows, and Linux.

### Prerequisites
Ensure all dependencies are installed and the project builds locally:
```bash
npm install
npm run build
```

### Build Command
To generate the installers, run the following command in the project root:
```bash
npm run package
```
*This script first runs `npm run build` (Vite build) and then executes `electron-builder`.*

### Output Artifacts
After the process completes, check the `release/` directory. You will find:
- **macOS:** `Salad-1.0.0.dmg` (and `.zip`)
- **Windows:** `Salad Setup 1.0.0.exe`
- **Linux:** `Salad-1.0.0.AppImage`

*(Note: Version numbers will match the `version` field in `package.json`)*

---

## 2. Deploying to the Website

The landing page source code is located in the `landing/` directory.

### Step 1: Prepare the Landing Page
1. Open `landing/index.html`.
2. Update the download buttons to point to the actual filenames generated in the previous step.

**Example Change:**
```html
<!-- Before -->
<a href="#" class="...">macOS</a>

<!-- After -->
<a href="./Salad-1.0.0.dmg" class="...">macOS</a>
```
*Repeat this for Windows (`.exe`) and Linux (`.AppImage`).*

### Step 2: Upload Files
Upload the following to your web server (e.g., via FTP, SCP, or a hosting dashboard) to the folder serving `hammaadworks.com/salad`:

1. **index.html**: The modified landing page file.
2. **logo.png**: The asset used in the header.
3. **Installers**: Upload the `.dmg`, `.exe`, and `.AppImage` files from the `release/` folder to the same directory.

### Step 3: Verify
Visit [hammaadworks.com/salad](https://hammaadworks.com/salad) and test:
1. The page loads correctly with styles and the logo.
2. Clicking "macOS", "Windows", and "Linux" triggers the correct file download.

---

## 3. Updating the Version

When releasing a new update:
1. Increment the `version` in `package.json` (e.g., `1.0.0` -> `1.0.1`).
2. Run `npm run package`.
3. Upload the new installer files.
4. Update `index.html` links to point to the new version filenames.
