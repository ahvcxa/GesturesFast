<div align="center">
  <img src="public/icons/icon128.png" alt="GesturesFast Logo" width="128" height="128">
  <h1>GesturesFast</h1>
  <p><strong>Fast, customizable, and context-aware mouse gesture navigation for your browser.</strong></p>

  [![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)]()
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Browser](https://img.shields.io/badge/Browser-Chrome-4285F4?logo=google-chrome&logoColor=white)]()
</div>

---

## ✨ Why GesturesFast?
GesturesFast is not just another mouse gesture extension. It is engineered with modern web architecture in mind. Whether you are navigating a simple blog or a complex Single Page Application (SPA) with encapsulated web components, GesturesFast delivers a smooth, native-like experience.

## 🚀 Key Features

* **🎯 Context-Aware Scrolling:** Hover over a specific sidebar, panel, or div. The extension intelligently traverses the DOM tree to scroll *only* the element under your cursor, not the whole page.
* **🛡️ Shadow DOM Piercing:** Works seamlessly on highly complex sites (like Google Gemini, YouTube, etc.) by piercing through encapsulated Web Components to find the true scrollable areas.
* **📏 Incremental & Absolute Scrolling:** Choose between jumping to the absolute Top/Bottom of a page, or doing a smooth "Incremental Scroll" (scrolling by half a viewport) so you never lose your reading spot.
* **🎨 Isolated Minimalist UI:** The gesture overlay is wrapped in its own closed Shadow DOM with `all: initial` CSS resets. This guarantees a consistent, Apple-like minimalist UI that is completely immune to CSS bleeding from host websites.
* **🧹 Clean Slate Philosophy:** Zero bloatware. The extension installs with an empty gesture dictionary, allowing you to build your own muscle memory from scratch.

## 🛠️ Available Actions
Map your gestures (Up, Down, Left, Right) to any of the following browser actions:
* Close Current Tab
* Reopen Last Closed Tab
* Go Back / Go Forward
* Reload Page
* Scroll to Top / Bottom
* Scroll Up / Down (Incremental)

## 📦 Installation (Developer Mode)

Since the extension is currently in beta, you can install it locally:

1. Clone the repository:
   ```bash
   git clone [https://github.com/ahvcxa/GesturesFast.git](https://github.com/ahvcxa/GesturesFast.git)
   cd GesturesFast
