# Open-World Electronics Lab - Simulation Interface

An interactive, responsive single-page web application bridging an **interactive 2D schematic wiring canvas** with an **interactive 3D virtual lab environment**.

Built with **React 18**, **Tailwind CSS**, **Lucide-style vector icons**, **HTML5 Canvas**, and **Three.js**.

---

## 🌟 Key Architecture & Capabilities

### 1. Overall Theme & App Shell (Clean High-Contrast Light Theme)
- **Color Palette**: Clean lab light theme (Canvas blueprint `#f8fafc` / `#ffffff`, sidebar & floating panels `#ffffff`/95 with subtle `border-slate-200` and soft elevation shadows `shadow-xl`, deep slate text `#0f172a` / `#334155`, vivid royal blue accents `#2563eb`, emerald `#059669`, and amber `#d97706`).
- **Layout**: Fullscreen (`100vw`, `100vh`, `overflow-hidden`) with a persistent top navigation bar and a shared state manager holding components, wires, and environmental parameters.

### 2. Persistent Top Header Bar
- **Left**:
  - Logo with blue circuit/spark icon badge + bold text **"Open-World Electronics Lab"** in deep slate.
  - Clean version tag badge: `circuitverse • SBH06387` with pulsing emerald dot.
- **Center-Left (Dynamic Preset Locations)**:
  - Interactive location pills that dynamically switch the 3D scene backdrop, materials, and lighting presets:
    - `Classroom` (Default): Tiled lab floor, whiteboard with circuit diagrams & formulas, bright fluorescent lighting fixtures. Presets: Sunlight `400 W/m²`, Temp `24°C`, Clouds `10%`.
    - `House` (Smart Home): Warm wooden parquet floor, living room window with outdoor view and burgundy curtains, warm soft ambient glow (`#fef3c7`). Presets: Sunlight `300 W/m²`, Temp `22°C`, Clouds `20%`.
    - `Farm` (Agricultural IoT): Outdoor terrain with lush green turf floor, open sky, rustic split-rail fence, distant low-poly green trees, bright direct sun. Presets: Sunlight `850 W/m²`, Temp `31°C`, Clouds `5%`.
    - `Factory` (Industrial): Dark concrete floor with yellow hazard caution stripes, steel overhead girder and criss-cross trusses, high-bay metal-halide fixtures (`#dbeafe`). Presets: Sunlight `150 W/m²`, Temp `29°C`, Clouds `0%`.
    - `Road` (Smart Highway): Dark asphalt road pavement, white shoulder edge markings, dashed yellow center lane dividers, tall highway street lamp post with glowing spot lamp. Presets: Sunlight `600 W/m²`, Temp `27°C`, Clouds `40%`.
  *(Transitions between environments are seamless without disturbing or unmounting workbench circuits).*
- **Center-Right (Active View Modes)**:
  - `2D Circuit Layer` (toggles the interactive schematic editor with light CAD dot-grid styling).
  - `3D World (FPP)` (toggles the 3D virtual lab daylight environment).
  - `<> Firmware & Code` (opens microcontroller C++ editor & live UART serial monitor).
  *(Toggling between 2D and 3D seamlessly swaps the central canvas viewport).*
- **Far Right (Telemetry Readout)**:
  - High-contrast status pill: `☀️ 12:38 PM` | `📍 City` | `🌡️ 28°C` | `🌧️ Rain (%)` | `📶 ESP32: IO2 ON/OFF (ADC)` | `⚡ [Live Voltage] V`.

### 3. Left Navigation & Expanded Proteus Device Library Drawer
In the left sidebar, the component drawer features full text search and dedicated EDA / Proteus category filters:
1. **Power Sources**:
   - `Solar PV Panel` (Tag: `PWR`) with live $V_{oc}$ & output power readouts, $V+$ and $\text{GND}/V-$ pin terminals.
   - `DC Power Supply (5V/12V)` (regulated bench source).
   - `Ground (GND)` ($0\text{V}$ reference datum).
2. **Microcontrollers**:
   - `Arduino Uno R3` (with dedicated pin headers: `D0`–`D13`, `A0`–`A5`, `5V`, `3.3V`, `GND`, `Vin`).
   - `ESP32 NodeMCU / DevKit V1` (Tensilica dual-core, WiFi/BLE, 12-bit ADC, IO2 status LED, 20 interactive pin headers).
3. **Sensors**:
   - `LDR (Photoresistor)` (light-dependent resistance dynamically coupled to environmental sunlight).
   - `DHT11 / Temperature Sensor` (dynamically linked to environment temperature slider).
   - `Ultrasonic Sensor (HC-SR04)` (`VCC`, `TRIG`, `ECHO`, `GND`).
   - `PIR Motion Sensor` (`VCC`, `OUT`, `GND`).
4. **Passives & Discrete**:
   - `Resistor` (configurable resistance in $\Omega$/$\text{k}\Omega$).
   - `Capacitor` (polar and non-polar).
   - `Potentiometer` (interactive wiper slider $0\% - 100\%$).
5. **Semiconductors & Actuators**:
   - `LED Indicator` (Red, Green with glow emission dynamics).
   - `Piezo Buzzer` (audio/visual frequency pulse).
   - `SG90 Micro Servo` (PWM angle control $0^\circ - 180^\circ$).
   - `16x2 I2C LCD Display` & `Relay Module (SPDT)`.
6. **Instruments**:
   - `Digital Multimeter (DMM)` (live LCD digital voltage/current readout).
   - `2-CH Oscilloscope` (dual-channel realtime animated signal sweep).

### 4. ESP32 NodeMCU / DevKit V1 Component Specification
- **2D Schematic Module**:
  - Dual-row DIP module (matte black PCB) with gold meandered trace antenna at top.
  - Classic silver metal RF shield can marked **ESP-WROOM-32** (WiFi • BLE 4.2 • dual core, FCC ID: 2AC7Z).
  - Micro-USB connector and tactile pushbuttons (`EN` and `BOOT`).
  - Active SMD Status LEDs: Red Power LED (`PWR`) and glowing Blue GPIO 2 LED (`IO2`).
  - 20 interactive pin terminals:
    - **Left**: `3V3`, `GND`, `D15`, `D2`, `D4`, `D32`, `D33`, `D34`, `D35`, `VN`.
    - **Right**: `VIN`, `GND`, `D23`, `D22`, `D21`, `D19`, `D18`, `D5`, `VP`, `EN`.
- **Simulation Linking & 12-Bit ADC**:
  - Reference Voltage: $3.30\text{ V}$.
  - 12-bit ADC resolution ($0 - 4095$):
    $$\text{ESP32\_ADC} = \min\left(4095, \max\left(0, \left\lfloor \frac{V_{\text{in}}}{3.3} \times 4095 \right\rfloor\right)\right)$$
  - GPIO 2 status LED automatically triggers **HIGH** when ADC reading $\ge 1350$ ($\approx 1.1\text{ V}$).
  - Connected Digital Multimeters read $3.30\text{ V}$ when wired to `3V3` or active `D2`.
- **Procedural 3D World (FPP) Model**:
  - Sleek black PCB with dual gold header pins, silver metallic RF shield can, micro-USB port, pushbuttons, and glowing blue SMD LED at GPIO 2 with local point light illumination.
  - Realistic curved 3D jumper wires dynamically connecting ESP32 analog pins to Solar PV or DMM.

### 5. Solar PV Panel Component Specification
- **2D Schematic Representation**:
  - Dark navy/blue grid-patterned rectangle with 8 monocrystalline silicon wafer cells, silver grid lines, and gold busbars.
  - Connection Pins:
    - `V+` (Positive output terminal, red dot with `+` sign)
    - `GND` / `V-` (Negative/Ground terminal, black/blue dot with `-` sign)
  - Live Readouts on Panel Body:
    - Open-Circuit Voltage: `Voc: [X.X] V`
    - Power Output: `P: [X.X] mW`
    - Current Solar Irradiance: `[X] W/m²`
- **Dynamic Physics Coupling**:
  - Terminal voltage scales dynamically with the Environment Sunlight slider ($0 - 1000\text{ W/m}^2$):
    $$V_{oc} = \min\left(5.00\text{ V}, \max\left(0.00\text{ V}, \frac{\text{Sunlight}}{1000} \times 5.0\text{ V} \times (1 - \text{Clouds} \times 0.0085)\right)\right)$$
  - Dragging the Sunlight slider or selecting weather presets (Sunny, Cloudy, Night) updates the Solar Panel voltage, Digital Multimeter measurement, Scope View waveform, and header telemetry in real time.
- **Realistic 3D World (FPP) Module**:
  - Angled mounting brackets and metal kickstand tilting the panel at $30^\circ$ toward the overhead gantry fixture and diagonal golden sunbeam.
  - Brushed aluminum frame holding monocrystalline photovoltaic cells with procedural silver grid texture.
  - Rear junction box with red and black terminal posts.
  - Surface sheen and active solar energy capture glow that brightens dynamically with sunlight intensity.
  - Curved 3D jumper wires connecting Solar Panel terminals directly to the Digital Multimeter on the bench.

### 6. Interactive 2D Schematic Canvas (Proteus ISIS Inspired)
- **Drag-and-Drop & Click-to-Add**:
  - Drag any component directly from the library drawer and drop it anywhere on the schematic canvas at your cursor.
  - Or click `+ Add` to position it automatically.
- **Click-to-Wire Pin Terminals**:
  - Hover over any terminal pin (shows animated glow ring) and click/drag to route an elastic orthogonal wire.
  - Manhattan 90° bends with real-time recalculation during component dragging.
- **Wire Selection & Deletion**:
  - Click any wire to select (glows cyan) and hit Delete / Backspace.
- **Preset Circuit Buttons**:
  - `Sample (ESP32 IoT)`: Instantly loads the **ESP32 NodeMCU DevKit V1 + Solar PV Panel + Digital Multimeter** IoT test circuit.
  - `Sample (Solar PV)`: Instantly loads a **Solar PV Panel + Digital Multimeter + Ground** circuit.
  - `Sample (Arduino + LDR)`: Loads the automated **Arduino Uno + LDR Photoresistor + Potentiometer + LED** circuit.
  - `Clear`: Empties the schematic canvas for custom designs.
  - `▶ EXECUTE IN 3D`: Validates circuit netlist and transitions into the 3D lab.

### 7. Procedural 3D Virtual Lab (FPP View)
- All parts placed on the 2D schematic are automatically synthesized as 3D models on the wooden workbench table:
  - **ESP32 DevKit V1**: Black PCB with dual gold header pin rows, silver ESP-WROOM-32 RF shield, micro-USB port, tactile buttons, red Power LED, and glowing blue GPIO 2 SMD LED.
  - **Solar PV Panel**: Tilted aluminum frame with active reflective sheen under the sunbeam.
  - **Arduino Uno R3**: Characteristic teal-blue PCB, silver USB connector, ATmega IC, and pin 13 LED.
  - **Solderless Breadboard**: Holding the illuminated LED and LDR sensor.
  - **Yellow DMM**: Industrial casing with live LCD digital voltage readout.
  - **SG90 Micro Servo**: Blue casing with rotating horn responding to PWM signals.
  - **3D Jumper Wires**: Curved colored wires running between components.
- **Floating HUDs**:
  - Environment Controls: Sliders for Sunlight, Temperature, Clouds, Time of Day, and weather presets.
  - Scope View: Dual-trace oscilloscope graph plotting live voltage and current.

### 8. Dynamic Weather Logic & Animated Rain Particle System
- **Intelligent Clouds Slider Trigger (> 80%)**:
  - When the **Clouds** slider is adjusted to **> 80%**:
    - Automatically switches to the **Rainy** weather state.
    - Activates the `Rainy` preset button in the bottom weather toolbar.
    - Dynamically reduces direct sunlight intensity down to heavy overcast levels ($20 - 50\text{ W/m}^2$), which immediately drops Solar PV Panel output voltage ($V_{oc}$), DMM readouts, and oscilloscope traces.
    - Saves the prior weather preset and sunlight baseline in memory.
  - When Clouds drop back to **$\le$ 80%**:
    - Automatically stops the rain particle system and deactivates rain mode.
    - Smoothly restores the pre-rain weather preset (`Sunny`, `Cloudy`, etc.) and pre-rain sunlight irradiance.
- **3D World (FPP) Visual Effects**:
  - **1,400 Slanted Rain Streaks**: High-performance `THREE.LineSegments` particle system with dynamic GPU vertex buffer updates, slanted downward with wind drift velocity and automatic floor recycling.
  - **240 Floor & Workbench Splash Particles**: Dedicated `THREE.Points` particle system rendering water droplets splashing and dissipating on both the floor and workbench ESD mat.
  - **Dynamic Wet Surface Shaders**: When raining, floor roughness drops from `0.5` to `0.12` and tabletop roughness drops to `0.04`, creating authentic wet reflective sheens across the lab.
  - **Atmospheric Dimming & Cool Storm Mist**: Sky background and exponential fog tint to cool storm blue-grey (`#94a3b8`), ambient and directional lights dim, and sharp golden sunbeams fade out completely.
- **Visual Feedback & Ambient Audio Synthesizer**:
  - **Pulsing Rain Badge**: `🌧️ RAIN ACTIVE` animated badge next to the Clouds slider readout in Environment Controls, and `🌧️ Rain ([X]%)` in the top header telemetry pill.
  - **Procedural Ambient Rain Audio Synthesizer**: Built entirely with the native **Web Audio API** using procedural pink/white noise buffers, a 1400 Hz biquad lowpass filter, and exponential gain ramping (100% self-contained, no external audio files), toggleable via an audio mute/unmute button.

### 9. Comprehensive Authentication System & Engineering Dashboard
- **Dual-Mode Sign In**:
  - **Email & Password Tab**: Clean authentication form with password visibility toggle, "Remember Me" local storage toggle, and validation.
  - **Phone OTP Login Tab**: Multi-country selector (`+91` India, `+1` USA, `+44` UK, `+49` Germany, `+81` Japan, `+61` Australia, `+65` Singapore, `+971` UAE), mobile phone input, and instant 6-digit OTP verification dispatch.
  - **Instant Guest / Demo Access**: 1-click bypass button providing instant engineering access with pre-configured verified credentials (`Dr. Evelyn Reed`, Lead Embedded Systems Engineer).
- **Registration Flow with Gmail OTP Verification**:
  - Complete engineer registration form: Full Name, Gmail / Educational Address, Mobile Number, Password with dynamic 4-stage strength meter (Weak, Fair, Good, Strong), Confirm Password, and Terms acceptance.
  - **Automated Gmail OTP Dispatch**: Generates a 6-digit verification code and triggers the interactive OTP modal with a simulated demo preview banner and "Auto-Fill" button.
- **6-Digit OTP Verification Modal**:
  - Auto-advancing digit inputs with Backspace reversal and automatic clipboard paste support.
  - 60-second active countdown timer with automatic resend enablement.
  - Interactive validation and immediate session elevation upon verification.
- **User Dashboard & Engineering Portal**:
  - **Header & Profile Pill**: User initials avatar, name, verification badges (`Gmail: ✅`, `Phone: ✅`), quick "⚡ Launch Lab" CTA, and dropdown menu with sign-out.
  - **Hero Action Banner**: Personalized greeting, system readiness telemetry, and primary CTA buttons ("⚡ Launch Electronics Lab", "➕ New Circuit").
  - **Interactive Project Cards**:
    1. `Solar PV Irradiance Monitor`: Loads PV panel + DMM circuit with high sunlight ($850\text{ W/m}^2$).
    2. `ESP32 IoT Weather Node`: Loads ESP32 DevKit V1 + Solar Panel + DMM circuit.
    3. `Arduino + LDR Smart Streetlight`: Loads Arduino Uno R3 + LDR photoresistor + LED circuit.
    4. `Proteus Multi-Instrument Test Bench`: Loads full instrumentation bench setup.
  - **Live Simulation Telemetry Stream**: Real-time log of physical events, solar voltage thresholds, and microcontroller execution logs.
  - **Account & Security Status Card**: Displays session tokens, 2FA status, and engine version.
- **Bi-Directional Lab Navigation**:
  - Persistent **"⬅ Dashboard"** button in the simulation header allowing users to return to their dashboard at any time.
  - User profile badge and Sign Out button integrated directly into the simulation top bar.
  - Session persistence powered by `localStorage` ensuring state preservation across reloads.

---

### 10. Production Node.js (Express + TypeScript) Backend & PostgreSQL Database
A dedicated, enterprise-grade backend service built with **Express**, **TypeScript**, and **Prisma ORM** running against **PostgreSQL 18**:

- **Relational Schema**:
  - `User`: Handles student and teacher identities with hashed passwords, roles (`STUDENT`, `TEACHER`, `ADMIN`), and timestamps.
  - `Project`: Stores circuit topology (`schematicData` JSON with parts and wires), environment presets (`environmentData` JSON), and unique share codes (`shareCode`).
  - `ProjectShare`: Role-based access control granting either `VIEWER` (read-only simulation) or `EDITOR` (collaborative editing and saving).
  - `SimulationLog`: Captures physical telemetry execution records, peak voltage ($V$), peak power ($\text{mW}$), component counts, and runtime duration.
- **RESTful API Service (Port 5000)**:
  - `POST /api/auth/login`: Issues JWT tokens for pre-seeded or registered users.
  - `GET /api/projects`: Retrieves user's created and shared circuits.
  - `POST /api/projects` & `PUT /api/projects/:id`: Saves/updates circuit schematics in PostgreSQL.
  - `GET /api/projects/share/:shareCode`: Public or class lookup for instant circuit sharing.
  - `POST /api/shares` & `DELETE /api/shares/:id`: Grants and revokes collaboration permissions by email.
  - `GET /api/analytics/teacher`: Aggregates active student counts, popular components, environment distributions, and student submissions.
  - `GET /api/export/project/:id/report` & `POST /api/export/direct-report`: Generates styled, printable Engineering Lab Experiment reports with automatic `@media print` dialog for immediate PDF saving.
  - `GET /api/export/project/:id/json`: Netlist JSON export for Proteus/EDA cross-compatibility.

- **Pre-Seeded Accounts (Password: `Password123!`)**:
  - 👨‍🏫 **Teacher**: `teacher@lab.edu` (Prof. Vikram Rao)
  - 👨‍🎓 **Student**: `student@lab.edu` (Aarav Sharma)
  - 🔬 **Lead Engineer**: `evelyn@lab.edu` (Dr. Evelyn Reed)
  - ⚙️ **Admin**: `admin@lab.edu` (Lab Administrator)

---

## 🚀 How to Run the Application

The application consists of a high-performance **Frontend SPA** and an **Express + PostgreSQL Backend API**:

### 1. Launch the Backend API (Node.js + PostgreSQL)
```cmd
cd backend
set PATH=C:\Users\chinm\nodejs;%PATH%
node dist/server.js
```
The backend API server will listen on `http://localhost:5000/api`.

### 2. Launch the Frontend Application
```powershell
powershell -ExecutionPolicy Bypass -File .\server.ps1
```
The frontend application will be live at `http://localhost:8085/`.

### 3. Run Backend Integration Test Suite
```cmd
set PATH=C:\Users\chinm\nodejs;%PATH%
node test_api.js
```
Runs 9 comprehensive automated tests verifying authentication, project CRUD, role-based sharing, telemetry logging, teacher analytics, and printable PDF report exports.
