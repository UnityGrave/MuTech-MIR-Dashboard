# MuTech MIR Dashboard - Pitch Visualizer

A real-time pitch detection and visualization web application built with TypeScript, Web Audio API, and Canvas. Uses the McLeod Pitch Method (MPM) algorithm via the Pitchy library for accurate frequency detection.

## Features

- **Real-time pitch detection** using the McLeod Pitch Method algorithm
- **Smooth scrolling visualization** of pitch over time on an HTML5 Canvas
- **Note name display** with cents deviation from perfect pitch
- **Test oscillator** for validating detection accuracy
- **Cross-browser support** for Chrome, Firefox, and Safari

## Prerequisites

- Node.js 18+ 
- npm 9+
- A modern browser (Chrome 89+, Firefox 76+, Safari 14.5+)

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/MuTech-MIR-Dashboard.git
   cd MuTech-MIR-Dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser** to `http://localhost:5173`

## Usage

1. Click the **Start** button to begin audio capture
2. Allow microphone access when prompted
3. Sing or play an instrument to see pitch visualization
4. Use the **Test Tone** button to validate detection with known frequencies

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Main Thread                          │
│  ┌─────────┐    ┌─────────────┐    ┌────────────────┐  │
│  │   UI    │◄───│ App Logic   │◄───│ Canvas Render  │  │
│  └─────────┘    └─────────────┘    └────────────────┘  │
│                        ▲                                │
│                        │ MessagePort                    │
└────────────────────────┼────────────────────────────────┘
                         │
┌────────────────────────┼────────────────────────────────┐
│                  Audio Thread                           │
│                        │                                │
│  ┌─────────┐    ┌──────┴──────┐    ┌────────────────┐  │
│  │Microphone│───►│Ring Buffer  │───►│ Pitchy (MPM)   │  │
│  └─────────┘    └─────────────┘    └────────────────┘  │
│                                                         │
│                 AudioWorklet Processor                  │
└─────────────────────────────────────────────────────────┘
```

## Browser Support

| Browser | Minimum Version | Notes |
|---------|-----------------|-------|
| Chrome  | 89+             | Full support |
| Firefox | 76+             | Full support |
| Safari  | 14.5+           | Requires user gesture to start AudioContext |
| Edge    | 89+             | Full support (Chromium-based) |

## Troubleshooting

### Microphone permission denied
- Check your browser settings and ensure the site has microphone access
- On macOS, verify System Preferences > Security & Privacy > Microphone

### No pitch detected
- Ensure you're making a clear, sustained tone
- Check the clarity threshold - lower values detect weaker signals
- Verify your microphone is working in other applications

### Audio glitches or dropouts
- Close other audio applications
- Check CPU usage - pitch detection is computationally intensive
- Try a different browser

## License

MIT License - see LICENSE file for details
