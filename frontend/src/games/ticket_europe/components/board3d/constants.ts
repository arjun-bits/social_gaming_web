/**
 * constants.ts — Shared visual constants for the board3d components.
 * Extracted from CityMarker.tsx and RouteMesh.tsx for modularity.
 */

// ── Regional architectural palettes ──────────────────────────────────────
export const REGION_WALL: Record<string, string> = {
  british: '#c0b090', nordic: '#b8a888', western: '#c8b888',
  alpine: '#c4b8a0', iberian: '#c89860', italian: '#c89870',
  eastern: '#bca880', russian: '#bca070',
};

export const REGION_ROOF: Record<string, string> = {
  british: '#5a3820', nordic: '#7a2818', western: '#6a4020',
  alpine: '#506070', iberian: '#884018', italian: '#804018',
  eastern: '#4a5830', russian: '#6a3018',
};

export const CITY_REGION: Record<string, string> = {
  london: 'british', edinburgh: 'british',
  paris: 'western', amsterdam: 'western', brussels: 'western', frankfurt: 'western',
  madrid: 'iberian', lisbon: 'iberian', barcelona: 'iberian', marseille: 'western',
  roma: 'italian', napoli: 'italian', palermo: 'italian', venezia: 'italian',
  zurich: 'alpine', munchen: 'alpine', wien: 'alpine', berlin: 'alpine',
  stockholm: 'nordic', copenhagen: 'nordic', oslo: 'nordic',
  warszawa: 'eastern', budapest: 'eastern', zagreb: 'eastern',
  sarajevo: 'eastern', sofia: 'eastern', bucuresti: 'eastern', athina: 'eastern',
  istanbul: 'eastern', sevastopol: 'eastern', dublin: 'british',
  kyiv: 'russian', moskva: 'russian',
};

// Lighthouse cities — rendered by LighthouseMesh instead of CityMarker buildings
export const LIGHTHOUSE_CITIES = new Set(['lisbon', 'palermo']);

// ── Route colours (vivid, matches game cards) ────────────────────────────
export const ROUTE_COLOR: Record<string, number> = {
  red: 0xee1111,
  blue: 0x0055ee,
  green: 0x00aa22,
  yellow: 0xffcc00,
  black: 0x3a3a55,     // Lighter purple-gray so visible against terrain
  white: 0xfffff0,     // Warm ivory
  pink: 0xff44cc,      // Brighter bubblegum
  orange: 0xff6600,
  any: 0xb0c8d8,       // Much lighter steel-blue, clearly different from black
};

// ── Per-city label offsets [x, extraY, z] for de-collision ────────────────
// Cities whose labels overlap from the isometric camera angle get nudged apart.
export const LABEL_OFFSETS: Record<string, [number, number, number]> = {
  // Wien/Zagreb/Budapest cluster
  wien:       [0,    0.25, 0],
  zagreb:     [0.6,  -0.15, 0],
  budapest:   [0.5,   0.0,  0],
  // Paris/Brussels area
  paris:      [-0.4,  0.0,  0],
  brussels:   [0.3,   0.2,  0],
  // Oslo/København
  oslo:       [-0.2,  0.3,  0],
  copenhagen: [0.3,  -0.1,  0],
  // London/Dublin overlap
  dublin:     [-0.5,  0.0,  0],
  london:     [0.2,   0.0,  0],
  // Amsterdam overlap
  amsterdam:  [0.3,   0.2,  0],
  // München/Frankfurt
  munchen:    [0.3,   0.0,  0],
  frankfurt:  [-0.2,  0.2,  0],
  // Sarajevo/Sofia
  sarajevo:   [-0.3,  0.0,  0],
  sofia:      [0.3,   0.0,  0],
  // Bucuresti/Sevastopol
  bucuresti:  [0.0,   0.2,  0],
  sevastopol: [0.4,   0.0,  0],
  // Athens/Istanbul
  athina:     [-0.3,  0.0,  0],
  istanbul:   [0.3,   0.0,  0],
};
