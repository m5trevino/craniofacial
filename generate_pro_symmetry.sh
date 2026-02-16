#!/bin/bash

# ESTABLISH PERIMETER
PROJECT_NAME="symmetry_pro"
mkdir -p "$PROJECT_NAME/src"
cd "$PROJECT_NAME"

# THE MANIFEST
cat << 'PKG' > package.json
{
  "name": "symmetry-pro",
  "private": true,
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.263.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.3",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.27",
    "tailwindcss": "^3.3.3",
    "vite": "^4.4.5"
  }
}
PKG

# TAILWIND CONFIG
cat << 'TW' > tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        'neon-green': '#00ff41',
        'tactical-gray': '#0d0d0d',
      }
    },
  },
  plugins: [],
}
TW

cat << 'PC' > postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
PC

# ENTRY POINT
cat << 'HTML' > index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
    <title>Symmetry Pro // Trevino Doctrine</title>
  </head>
  <body class="bg-black text-white">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
HTML

# MAIN LOGIC
cat << 'MAIN' > src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
MAIN

cat << 'CSS' > src/index.css
@tailwind base;
@tailwind components;
@tailwind utilities;

body { font-family: 'Courier New', monospace; overscroll-behavior: none; }
input[type=range] { -webkit-appearance: none; background: transparent; }
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none; height: 18px; width: 18px; border-radius: 50%;
  background: #00ff41; margin-top: -7px; border: 2px solid #000;
}
input[type=range]::-webkit-slider-runnable-track {
  width: 100%; height: 4px; background: #333; border-radius: 2px;
}
