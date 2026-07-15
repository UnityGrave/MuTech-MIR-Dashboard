# MuTech — Real-Time Pitch Detection & Visualization

A browser-based **music information retrieval (MIR)** dashboard that detects the pitch of live audio in real time and visualises it on a scrolling canvas — showing the detected note and its cents deviation from perfect pitch. Built in **TypeScript** with the **Web Audio API** and **Canvas**, no UI framework.

## Overview

MuTech captures microphone input, runs pitch detection on a dedicated audio thread, and renders a smooth, time-scrolling pitch graph. It's a from-scratch audio-DSP + visualization project: no charting library, just the Web Audio API, an `AudioWorklet`, a ring buffer, and 2D canvas rendering.

## Features

- **Real-time pitch detection** using the **McLeod Pitch Method (MPM)** via the [`pitchy`](https://www.npmjs.com/package/pitchy) library
- **Scrolling canvas visualization** of pitch over time
- **Note name + cents deviation** readout (music-theory mapping)
- **Test oscillator** to validate detection against known frequencies
- **Off-main-thread audio** via `AudioWorklet` for glitch-free processing
- Cross-browser (Chrome/Firefox/Safari)

## Tech Stack

| Concern | Technology |
|---------|-----------|
| Language | **TypeScript 5** |
| Audio | **Web Audio API** + `AudioWorklet`, `getUserMedia` |
| Pitch algorithm | `pitchy` (McLeod Pitch Method) |
| Visualization | HTML5 **Canvas** (2D) |
| Build | **Vite 5** |
| Quality | ESLint + Prettier |
| Deploy | Docker + Nginx |

## Architecture

```
src/
  main.ts                       # app bootstrap
  audio/
    audio-context.ts            # Web Audio graph setup
    microphone.ts               # getUserMedia capture
    pitch-processor.ts          # AudioWorklet — MPM pitch detection
    test-oscillator.ts          # reference-tone generator
  data/circular-buffer.ts       # ring buffer for audio frames
  visualization/
    canvas.ts, renderer.ts      # scrolling pitch render loop
    frequency-mapping.ts        # Hz → screen mapping
  utils/music-theory.ts         # frequency → note name + cents
  types/audio-worklet.d.ts
```

Design notes: the main thread handles UI + canvas; a separate **audio thread** (AudioWorklet) does capture → ring buffer → Pitchy (MPM) detection, communicating back via a `MessagePort`. Includes a Product Requirements Document and research notes in the repo.

## Getting Started

### Prerequisites
- Node.js 18+ and npm 9+ (or Docker)
- A modern browser (Chrome 89+, Firefox 76+, Safari 14.5+)

### Local development
```bash
git clone https://github.com/UnityGrave/MuTech-MIR-Dashboard.git
cd MuTech-MIR-Dashboard
npm install
npm run dev          # http://localhost:5173
```

### Docker
```bash
docker compose -f docker-compose.dev.yml up   # dev, hot reload
docker compose up -d                          # production (Nginx) → http://localhost:8080
```

### Scripts
`npm run dev` · `npm run build` (tsc + vite) · `npm run preview` · `npm run lint` · `npm run format`

## Usage
1. Click **Start** and allow microphone access.
2. Sing or play a note to see the pitch trace, note name, and cents offset.
3. Use the **Test Tone** to verify detection against a known frequency.

## Developed At

Music Information Retrieval project at **De La Salle University**.

## License

MIT — see [`LICENSE`](LICENSE). 
