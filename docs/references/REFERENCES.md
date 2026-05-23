# PartyHub — Design References & Development Documentation

This folder documents all the visual references, design decisions, and external resources used to build the PartyHub social gaming platform.

---

## 📁 Folder Structure

```
docs/references/
├── REFERENCES.md          ← this file
├── ARCHITECTURE.md        ← technical architecture deep-dive
├── BOARD_DESIGN.md        ← 3D board design notes
└── images/
    ├── ref_01 … ref_13    ← AI-generated design targets & building references
    ├── ui_01 … ui_03      ← captured UI milestone screenshots
    └── progress_01 … 04   ← board development progress screenshots
```

---

## 🖼️ Image Index

### Target Reference Images (AI-Generated)

These images were generated during design sessions to establish the visual target for the 3D Ticket to Ride: Europe board. The goal was a **low-poly, board-game-aesthetic 3D map** with dramatic perspective camera.

| File | Description | Used For |
|---|---|---|
| `ref_01_3d_board_target_A.jpg` | British/Nordic buildings — castle clock tower, red Scandinavian house | CityMarker `british` and `nordic` region roof/wall colours |
| `ref_02_3d_board_target_B.jpg` | Western European buildings — Amsterdam brick house, Dutch clock tower | CityMarker `western` region style, `#c8b888` wall tone |
| `ref_03_3d_board_target_C.jpg` | Iberian/Mediterranean buildings — terracotta Moorish house, teal-domed cathedral | CityMarker `iberian` + `italian` styles, `#c89860` wall tone |
| `ref_04_3d_board_target_D.jpg` | Russian/Eastern buildings — Baroque palace + onion-dome orthodox church | CityMarker `russian` and `eastern` region styles |
| `ref_05_3d_board_target_E.jpg` | Mixed European isometric buildings | Station building shape inspiration (barrel-vault roof) |
| `ref_06_3d_board_target_F.jpg` | Detailed European townhouses + clock towers | Window placement, wing proportions for `StationBuilding` |
| `ref_07_3d_board_target_G.jpg` | Gothic cathedral + French Baroque facade | `western` region roofline colours |
| `ref_08_3d_board_target_H.jpg` | Northern European half-timber houses | Nordic wing + chimney details |
| `ref_09_3d_board_target_I.jpg` | Mediterranean dome churches + campaniles | Italian region dome inspiration |
| `ref_10_buildings_europe_mixed.jpg` | Full isometric city scene overview | Density reference — how buildings sit relative to roads/terrain |
| `ref_11_isometric_cityscape_overview.jpg` | Top-down isometric city map | Layout reference for how stations relate to route tracks |
| `ref_12_buildings_western_alpine.png` | Western / Alpine building pair | Alpine barrel-vault roof shape → implemented in `StationBuilding` |
| `ref_13_buildings_iberian_greek.png` | Iberian terracotta + Greek classical | Iberian orange tone (`#c89860`), Greek white columns |

### UI Milestone Screenshots

| File | Description | Notes |
|---|---|---|
| `ui_01_host_game_lobby.png` | HostView — game selection lobby with QR code | Shows the game card picker (Secret Signals, TTRE, Neon Tri) |
| `ui_02_host_configure_game.png` | HostView — Configure Game screen | Team setup panel, "NEED 2 MORE PLAYERS" badge |
| `ui_03_tv_secret_signals_lobby.png` | TVPage — Secret Signals lobby with 5 players joined | Full-screen TV view, player list, QR code, PIN badge |

### Board Development Progress

| File | Description | Notes |
|---|---|---|
| `progress_01_player_map_early.png` | Player mobile view — early SVG tile map | Before 3D migration; isometric sprites per city |
| `progress_02_player_map_routes.png` | Player view with Routes tab | Shows coloured route blocks in player mobile UI |
| `progress_03_host_board_isometric.png` | Host board — first 3D R3F iteration | First perspective camera, early terrain mesh |
| `progress_04_tv_ttre_view.png` | TVPage TTRE board view | TV-formatted board with map + player panel |

---

## 🎨 Colour Palette Decisions

### Terrain Palette (TerrainMesh.tsx)

| Elevation Range | Hex | Name | Notes |
|---|---|---|---|
| `< 0.04` | `#4a9ad4` | Coastal water | Fjords, coastal flats |
| `< 0.09` | `#2d8a40` | Bright lowland grass | Atlantic coast, Po valley |
| `< 0.18` | `#2a7838` | Lush green plains | France, Germany, Poland |
| `< 0.30` | `#256630` | Dark forest green | Central European forests |
| `< 0.44` | `#7a6040` | Brown-green highlands | Pyrenees foothills, Balkans |
| `< 0.58` | `#8a7860` | Rocky grey-tan | Carpathians, Alpine foothills |
| `< 0.72` | `#9a9080` | Alpine stone grey | Pre-Alps, Scottish uplands |
| `≥ 0.72` | `#e0dcd4` | Snow / ice cap | High Alps summit |

### Route Colour Palette (RouteMesh.tsx)

Matches the official Ticket to Ride card colours:

| Route Color | Hex | Notes |
|---|---|---|
| Red | `#ff1818` | |
| Blue | `#0858ff` | |
| Green | `#08b030` | |
| Yellow | `#ffc000` | |
| Black | `#1e2838` | |
| White | `#f0ece4` | |
| Pink | `#f018a8` | |
| Orange | `#ff5808` | |
| Any (grey) | `#7890a0` | Wild routes |

### City Building Regional Styles (CityMarker.tsx)

| Region | Wall Color | Roof Color | Cities |
|---|---|---|---|
| british | `#c0b090` | `#5a3820` dark brown | London, Edinburgh |
| nordic | `#b8a888` | `#7a2818` deep red | Stockholm, Copenhagen |
| western | `#c8b888` | `#6a4020` warm brown | Paris, Amsterdam, Brussels, Frankfurt |
| alpine | `#c4b8a0` | `#506070` slate blue-grey | Zurich, München, Wien, Berlin |
| iberian | `#c89860` | `#884018` terracotta | Madrid, Lisbon, Barcelona, Marseille |
| italian | `#c89870` | `#804018` burnt orange | Roma, Napoli, Palermo, Venezia |
| eastern | `#bca880` | `#4a5830` forest green | Warsaw, Budapest, Zagreb, Sofia, Sarajevo, Bucharest, Athina |
| russian | `#bca070` | `#6a3018` dark red | Kyiv, Moskva |

---

## 🏗️ 3D Scene Architecture

### Component Hierarchy

```
EuropeBoard3D
├── <Canvas> (Three.js renderer, fov=62, pos=[0,9,17])
│   ├── Lighting
│   │   ├── ambientLight (intensity=0.65, #d8e8f0)
│   │   ├── directionalLight (sun, pos=[10,28,14], intensity=1.2, shadows)
│   │   ├── directionalLight (fill, pos=[-8,10,-12], intensity=0.28)
│   │   └── hemisphereLight (sky=#c8e8d0, ground=#2a4020, intensity=0.45)
│   ├── MapControls (pan+zoom, no rotate)
│   ├── OceanPlane       → deep teal (#0e2840), extended 100×80 units
│   ├── OceanDecorations → 10 sailboats (Atlantic, Med, North Sea, Baltic)
│   ├── TerrainMesh      → Delaunay triangulation, vertex-coloured, flatShading
│   ├── MountainMesh     → 22 cone peaks w/ snow caps
│   ├── TreeMesh         → 200+ 4-cone pine trees, 26 regional clusters
│   ├── LighthouseMesh   → 6 coastal towers (terracotta, glowing lamp)
│   ├── RouteMesh        → BoxGeometry per slot, emissive colour blocks
│   └── CityMarker[]     → StationBuilding + Billboard Text per city
```

### Camera Settings

```typescript
position: [0, 9, 17]    // Low south-facing, creates dramatic depth
fov: 62                 // Medium-wide, good for board overview
lookAt: [0, 0, -1]     // Points slightly north of centre
```

This creates the **board-game foreshortening effect**: southern cities (Lisbon, Palermo, Athina) appear large and near; northern cities (Stockholm, Moskva, Edinburgh) appear small and distant — exactly matching a physical board viewed from across the table.

### Coordinate Mapping

```typescript
// boardData uses: x ∈ [0,1000], y ∈ [0,800]
// Three.js world:  X ∈ [-10,+10], Z ∈ [-7,+7]
export function toWorld(x: number, y: number): [number, number] {
  return [(x / 1000) * 20 - 10, (y / 800) * 14 - 7];
}
```

### Terrain Elevation

The Alps use `0.75–0.80` raw elevation × `2.2` multiplier = **1.65–1.76 world units**. Combined with `jitter()` noise this makes mountain peaks clearly visible above the terrain mesh. City `baseY` values match terrain elevation so stations sit correctly on hills.

---

## 📚 External References Used

### Libraries & Frameworks

| Library | Version | Use |
|---|---|---|
| React Three Fiber | ^9 | 3D scene via React components |
| @react-three/drei | latest | `Billboard`, `Text`, `MapControls` helpers |
| Three.js | ^0.163 | Core 3D geometry, materials, shadows |
| d3-delaunay | ^6 | Bowyer-Watson Delaunay triangulation for terrain mesh |
| Zustand | ^4 | Client-side game state management |
| React Router | v6 | `/host/:room`, `/play`, `/tv/:room` routing |
| Vite | ^5 | Frontend bundler, HMR dev server |
| ws | ^8 | WebSocket server (backend) |
| Express | ^4 | HTTP API layer (backend) |
| TypeScript | ^5 | Full-stack type safety |
| Puppeteer | ^24 | Headless browser E2E testing |

### Design Inspiration

| Reference | What Was Used |
|---|---|
| **Ticket to Ride: Europe (board game)** | City positions, route topology, route colours, ferry/tunnel types, destination tickets concept |
| **Codenames (board game)** | Base inspiration for Secret Signals word deduction mechanic |
| **Low-poly 3D map aesthetic** | Flat-shaded geometry, visible triangle facets, hard edges — inspired by mobile indie games |
| **AI-generated reference images** | Building regional styles, colour palettes, station proportions (see `images/ref_*.jpg`) |
| **D3.js Delaunay triangulation** | Algorithm used to triangulate city+scatter point set into the terrain mesh |

### Key Implementation Decisions

1. **WebSocket-only state** — No REST endpoints for game state. All updates broadcast via WebSocket events from the backend `WSHub`. Ensures sub-100ms latency on LAN.

2. **Delaunay terrain** — Instead of a grid heightmap, city locations + hand-placed scatter points drive the triangulation. This means terrain naturally follows city geography — hills appear where the real Alps/Pyrenees are.

3. **No external 3D models** — All geometry is pure Three.js primitives (`BoxGeometry`, `ConeGeometry`, `CylinderGeometry`). Zero dependency on GLTF/OBJ files. Instant load, no CDN.

4. **Billboard text labels** — `@react-three/drei` `<Billboard>` + `<Text>` replaces HTML `<Html>` overlays used in early R3F versions. Works without `frameloop="demand"` and renders correctly in WebGL layer.

5. **SwiftShader for CI screenshots** — Puppeteer E2E tests use `--use-gl=swiftshader` to enable software WebGL rendering in headless Chromium, allowing canvas pixel sampling without a GPU.

---

## 🗓️ Development Timeline

| Phase | Changes |
|---|---|
| **Phase 1** | Backend WebSocket server, Secret Signals game engine, HostView/PlayerView/TVPage scaffold |
| **Phase 2** | SVG tile-based map for TTRE (IsometricTileMap), QR code joining, room management |
| **Phase 3** | Migration from SVG map to React Three Fiber 3D scene (`EuropeBoard3D`) |
| **Phase 4** | Visual overhaul — green terrain palette, mountain cones, tree forests, sailboats, lighthouses, city station buildings, bold route blocks |
| **Phase 5** | HostView layout — full-content map + overlay player scores + overlay end button |
| **Phase 6** | Cleanup — remove 15+ scratch scripts, 59 screenshots, write README and these docs |
