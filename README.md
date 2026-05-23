# 🎮 PartyHub — Social Gaming Web

A full-stack, real-time multiplayer party gaming platform built for local network play. Host games on a TV or laptop, players join on their phones — no app install needed.

## Games Included

| Game | Players | Description |
|---|---|---|
| **Ticket to Ride: Europe** | 2–5 | Claim railway routes across a fully 3D low-poly Europe map. Includes mountains, forests, lighthouses, and sailboats. |
| **Secret Signals** | 4–10 | Codenames-style word deduction game. Two teams, one spymaster each. |

---

## Architecture

```
social_gaming_web/
├── backend/          Node.js + TypeScript WebSocket server
│   └── src/
│       ├── server.ts          Express + ws server (port 8080)
│       ├── core/wsHub.ts      Room & game state management
│       └── core/engine/       Game logic (TTRE + Secret Signals)
├── frontend/         React + Vite + TypeScript SPA (port 5173)
│   └── src/
│       ├── pages/             HostView, PlayerView, TVPage, LobbyPage
│       └── games/
│           ├── ticket_europe/ Ticket to Ride: Europe
│           │   └── components/board3d/   Three.js R3F 3D board
│           └── secret_signals/           Secret Signals UI
└── tests/            Puppeteer E2E integration tests
```

### Key Design Decisions

- **Two-view split**: `/host/:room` = TV/laptop view (large screen, QR code, game board). `/play` = player mobile controller.
- **WebSocket-only state sync**: No REST for game state — all updates push via WebSocket events.
- **3D board (TTRE)**: Built with React Three Fiber (R3F). Low-poly terrain, Delaunay triangulation, perspective camera. No pre-made assets — all geometry is procedural Three.js.
- **Server-authoritative**: Backend drives game state; frontend is a pure view/input layer.

---

## Prerequisites

- **Node.js** v18+
- **npm** v9+
- Runs on Windows (WSL), macOS, Linux

---

## Running Locally

### 1. Backend

```bash
cd backend
npm install
npm run dev
# → http://localhost:8080
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### 3. Play

1. Open **http://localhost:5173** on your TV/laptop → click **Create Room**
2. Choose **Ticket to Ride: Europe** or **Secret Signals**
3. Players scan the QR code shown on the host screen with their phones
4. Host clicks **Start Game** once all players have joined

> **LAN play**: Replace `localhost` with your machine's local IP (shown on the host screen) so players on the same Wi-Fi can join from real phones.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express, `ws` (WebSockets), TypeScript |
| Frontend | React 18, React Router v6, Vite, TypeScript |
| 3D Rendering | Three.js, React Three Fiber (R3F), @react-three/drei |
| State | Zustand (client-side game state) |
| Styling | Vanilla CSS + Tailwind utility classes |
| Testing | Puppeteer (headless Chromium E2E) |

---

## Running Tests

Tests live in `tests/` and use Puppeteer + the running dev servers.

```bash
# Make sure both backend (8080) and frontend (5173) are running first

cd tests

# Full E2E (both games, screenshot validation)
node test_e2e_gameplay.js

# Ticket to Ride Europe specific
node test_ttre_gameplay.js

# Full gameplay flow
node test_full_gameplay.js
```

Screenshots are written to `e2e_screenshots/` (git-ignored).

---

## Project Scripts

```bash
# Root (runs puppeteer-based tools)
npm install        # installs puppeteer at root level

# Backend
cd backend && npm run dev      # dev server with ts-node
cd backend && npm run build    # compile TypeScript to dist/

# Frontend
cd frontend && npm run dev     # Vite HMR dev server
cd frontend && npm run build   # production bundle → frontend/dist/
cd frontend && npm run preview # preview production build on :4173
```

---

## 3D Board — Ticket to Ride Europe

The TTRE board is a fully procedural 3D scene built with React Three Fiber:

- **Terrain**: Delaunay-triangulated mesh with per-city elevation values. Alps reach ~1.6 world units. Vertex-coloured with green palette (lowland → alpine snow).
- **Mountains**: 22 explicit cone-peak clusters (Alps, Pyrenees, Scandinavia, Carpathians, Balkans, Scotland).
- **Trees**: 200+ low-poly 4-cone pine trees in 26 regional forest clusters.
- **Routes**: Solid coloured box geometry per route slot — vivid emissive glow matches card colours.
- **Cities**: Miniature 3D train station buildings (barrel-vault roof, wings, windows) per region style. Billboard white text labels always face camera.
- **Lighthouses**: Tapered terracotta towers at coastal cities (Lisbon, Edinburgh, Palermo, Athina, Stockholm, Amsterdam).
- **Sailboats**: 10 decorative boats in Atlantic, Mediterranean, North Sea, Baltic.
- **Camera**: Perspective `[0,9,17] fov=62`, MapControls (pan+zoom, no rotation). Creates dramatic depth — south cities large, north cities small.

---

## License

MIT
