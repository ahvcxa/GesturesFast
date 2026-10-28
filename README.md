<div align="center">
  <img src="public/icons/icon128.png" alt="GesturesFast Logo" width="128" height="128">
  <h1>GesturesFast</h1>
  <p><strong>Fast, customizable, and context-aware mouse gesture navigation for your browser.</strong></p>

  <p>
    <a href="https://github.com/ahvcxa/GesturesFast/releases/latest"><img src="https://img.shields.io/badge/version-1.3.0-blue.svg?style=for-the-badge" alt="Version"></a>
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License: MIT"></a>
    <img src="https://img.shields.io/badge/Browser-Chrome-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Browser">
  </p>
</div>

---

## ✨ Why GesturesFast?

**GesturesFast** is not just another mouse gesture extension. It is engineered with modern web architecture in mind. Whether you are navigating a simple blog or a complex Single Page Application (SPA) with encapsulated web components, GesturesFast delivers a smooth, native-like experience without draining your system resources.

## 🚀 Key Features

* **🎡 Wheel Gestures (Hold + Scroll):** Hold your trigger button and scroll the mouse wheel up or down to switch between adjacent tabs or trigger any custom action instantly.
* **🏷️ Action Preview HUD & Stealth Mode:** See the matched action name directly beneath the gesture arrows while drawing, or toggle on Stealth Mode to execute gestures completely silently.
* **🎯 Context-Aware Scrolling:** Hover over a specific sidebar, panel, or `div`. The extension intelligently traverses the DOM tree to scroll *only* the element under your cursor, not the whole page.
* **🛡️ Shadow DOM Piercing:** Works seamlessly on highly complex sites (like Google Gemini, YouTube, etc.) by piercing through encapsulated Web Components to find the true scrollable areas.
* **🎨 Customizable Themes & Live Exceptions:** Personalize your arrow and overlay colors, and blacklist specific domains (including subdomains) like Figma or Miro with instant live effect.
* **💾 JSON Backup & One-Click Reset:** Export your gestures and settings to a JSON file, import them on any machine, or reset to defaults anytime.
* **⚡ Ready-to-Use Defaults:** Zero bloatware. Comes pre-configured with intuitive default gestures and built-in duplicate gesture protection.

## 🛠️ Available Actions

Map your directional gestures (**Up**, **Down**, **Left**, **Right**) or **Wheel Gestures** to any of the following browser actions:

### 📑 Tab & Window Management
- **Switch to Right / Left Tab** ✨ *New*
- **Go to Last Active Tab** (Alt+Tab behavior)
- **Open New Tab**
- **Duplicate Tab** ✨ *New*
- **Close Current Tab / Close Other Tabs / Close Tabs to the Right** ✨ *New*
- **Reopen Last Closed Tab**
- **Pin / Unpin Tab**
- **Toggle Fullscreen** ✨ *New*

### 🧭 Navigation & Scrolling
- **Go Back / Go Forward**
- **Reload Page**
- **Scroll to Top / Bottom**
- **Scroll Up / Down** (Dynamic viewport-aware incremental scroll)

## 📦 Installation

### Option 1: Install from Latest Release (Recommended)
1. Go to the [Releases page](https://github.com/ahvcxa/GesturesFast/releases/latest) of this repository.
2. Download the `GesturesFast-v1.3.0.zip` file.
3. Extract the ZIP file into a permanent folder on your computer.
4. Open Google Chrome and navigate to `chrome://extensions/`.
5. Enable **Developer mode** in the top right corner.
6. Click **Load unpacked** and select the folder you just extracted.

### Option 2: Build from Source (For Developers)
1. Clone the repository:
   ```bash
   git clone https://github.com/ahvcxa/GesturesFast.git
   cd GesturesFast
   ```
2. Install dependencies & build the project:
   ```bash
   npm install
   npm run build
   ```
3. Load the generated `dist` folder into Chrome via the `chrome://extensions/` page.

## 🖱️ Usage

1. **Configure:** Open the extension settings to choose your **Trigger Button** (Middle Click or Right Click).
2. **Trigger:** Press and hold your chosen button anywhere on a web page.
3. **Draw:** Drag your mouse to draw a gesture (e.g., Down, Left-Up, etc.).
4. **Execute:** Release the button to execute the mapped action.

## 🚧 Known Limitations

Due to Chrome's strict security policies, content scripts (and therefore mouse gestures) cannot be injected into:
- `chrome://` pages (e.g., Settings, Extensions page)
- The Chrome Web Store (`chrome.google.com/webstore`)
- Local `file:///` URLs (unless explicitly allowed in extension settings)

## 🏗️ Built With

- **[React](https://reactjs.org/)** & **[TypeScript](https://www.typescriptlang.org/)** (Options UI)
- **[Tailwind CSS](https://tailwindcss.com/)** (Styling)
- **[Vite](https://vitejs.dev/)** (Bundler)
- **Manifest V3 Architecture**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
