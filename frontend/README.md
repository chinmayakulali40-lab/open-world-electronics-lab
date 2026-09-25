# Frontend - Open-World Electronics Lab

Interactive single-page application bridging a 2D schematic capture editor with a 3D daylight lab environment.

## 🚀 Overview
- **2D Schematic Canvas**: Dot-grid snapping, dynamic orthogonal wire routing, real-time circuit simulation, multi-terminal pin mapping.
- **3D Interactive Workbench**: Realistic Three.js components, breadboard, solar panel, interactive multimeter probes, dynamic environmental presets (Classroom, Smart Home, Solar Farm, Industrial Factory, Smart Highway).
- **Embedded C++ Firmware Editor & Serial Monitor**: Microcontroller IDE for Arduino Uno and ESP32 DevKit V1 with syntax highlighting and live UART terminal.
- **Dual Authentication**: Integrated JWT-backed Email and Phone OTP verification dialogs.

## 🛠️ Tech Stack
- **React 18** (UMD build)
- **Tailwind CSS** (CDN with custom lab color palette)
- **Three.js & OrbitControls** (WebGL 3D rendering)
- **Babel Standalone** (In-browser JSX compilation)

## 💻 Running Locally
From the project root:
```bash
node serve.js
```
Or with PowerShell:
```powershell
.\server.ps1
```
Open [http://localhost:8085](http://localhost:8085) in your web browser.
