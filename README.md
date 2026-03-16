<div align="center">
  <img src="public/icons/icon128.png" alt="GesturesFast Logo" width="128" height="128">
  <h1>GesturesFast</h1>
  <p><strong>Fast, customizable, and context-aware mouse gesture navigation for your browser.</strong></p>

  [![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](https://github.com/ahvcxa/GesturesFast/releases/latest)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Browser](https://img.shields.io/badge/Browser-Chrome-4285F4?logo=google-chrome&logoColor=white)]()
</div>

---

## ✨ Why GesturesFast?
GesturesFast is not just another mouse gesture extension. It is engineered with modern web architecture in mind. Whether you are navigating a simple blog or a complex Single Page Application (SPA) with encapsulated web components, GesturesFast delivers a smooth, native-like experience without draining your system resources.

## 🚀 Key Features

* **🎯 Context-Aware Scrolling:** Hover over a specific sidebar, panel, or div. The extension intelligently traverses the DOM tree to scroll *only* the element under your cursor, not the whole page.
* **🛡️ Shadow DOM Piercing:** Works seamlessly on highly complex sites (like Google Gemini, YouTube, etc.) by piercing through encapsulated Web Components to find the true scrollable areas.
* **👻 Stealth Mode:** Built for power users. Once you've built muscle memory, toggle on Stealth Mode to hide the visual arrows and let the extension work silently in the background.
* **🎨 Customizable Themes:** Personalize your gesture trail! Easily change the arrow and background colors via the Options page to match your browser theme (e.g., a "Matrix" theme with neon green arrows on a black background).
* **📏 Incremental & Absolute Scrolling:** Choose between jumping to the absolute Top/Bottom of a page, or doing a smooth "Incremental Scroll" so you never lose your reading spot.
* **🧹 Clean Slate Philosophy:** Zero bloatware. The extension installs with an empty gesture dictionary, allowing you to build your own rules from scratch.

## 🛠️ Available Actions
Map your gestures (Up, Down, Left, Right) to any of the following browser actions:

**Tab Management:**
* Go to Previous Tab✨ *New*
* Open New Tab ✨ *New*
* Pin / Unpin Tab ✨ *New*
* Close Current Tab
* Reopen Last Closed Tab

**Navigation & Scrolling:**
* Go Back / Go Forward
* Reload Page
* Scroll to Top / Bottom
* Scroll Up / Down (Incremental)

## 📦 Installation

### Option 1: Install from Latest Release (Recommended)
1. Go to the [Releases page](https://github.com/ahvcxa/GesturesFast/releases/latest) of this repository.
2. Download the `GesturesFast-v1.0.0.zip` file.
3. Extract the ZIP file into a permanent folder on your computer.
4. Open Google Chrome and navigate to `chrome://extensions/`.
5. Enable **Developer mode** in the top right corner.
6. Click **Load unpacked** and select the folder you just extracted.

### Option 2: Build from Source (For Developers)
1. Clone the repository:
   ```bash
   git clone [https://github.com/ahvcxa/GesturesFast.git](https://github.com/ahvcxa/GesturesFast.git)
   cd GesturesFast
2. Install dependencies and build the project:
   ```bash
   npm install
   npm run build
3. Load the generated `dist` folder into Chrome via the Extensions page.

## 🖱️ Usage
1. Open the extension settings to choose your **Trigger Button** (Middle Click or Right Click).
2. Press and hold your chosen button anywhere on a web page.
3. Drag your mouse to draw a gesture (e.g., Down, Left-Up, etc.).
4. Release the button to execute the mapped action.

## 🚧 Known Limitations
Due to Chrome's strict security policies, content scripts (and therefore mouse gestures) cannot be injected into:
* `chrome://` pages (e.g., Settings, Extensions page)
* The Chrome Web Store (`chrome.google.com/webstore`)
* Local `file:///` URLs (unless explicitly allowed in extension settings)

## 🏗️ Built With
* [React](https://reactjs.org/) & [TypeScript](https://www.typescriptlang.org/) (Options UI)
* [Tailwind CSS](https://tailwindcss.com/) (Styling)
* [Vite](https://vitejs.dev/) (Bundler)
* Manifest V3 Architecture

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
