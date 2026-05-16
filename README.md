# Social Gaming Web

A full-stack, cloud-ready web application for local-network multiplayer games like Secret Signals.

This project uses a monorepo setup with a Node.js/TypeScript backend and a React/TypeScript/Vite frontend.

## Architecture

- **/backend**: A pure Node.js WebSocket server managing room states and game logic (Secret Signals). Written entirely in TypeScript.
- **/frontend**: A Vite + React + TypeScript web application that provides two modes:
  - **Host View (`/host/:room`)**: Designed for large screens (TV/Laptop). Displays the game board, scores, and a QR code for players to join.
  - **Player View (`/play`)**: Designed for mobile devices. Used as a controller for operatives and spymasters.

## Prerequisites

- Node.js (v18+)
- npm

## Running the Application Locally

### 1. Start the Backend

Open a terminal and navigate to the backend directory:

```bash
cd backend
npm install
npm run dev
```

The backend server will start on `http://localhost:8080`.

### 2. Start the Frontend

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

## How to Play

1. **Host a Game**: Open your browser on a TV or laptop and navigate to `http://localhost:5173/`. Click **Create Room (Host TV)**.
2. **Join a Game**: Players can scan the QR code displayed on the host screen using their mobile phones. This will take them to the Player View where they can choose a team, assign a Spymaster, and start the game!

## Tech Stack

- **Backend**: Node.js, Express, `ws` (WebSockets), TypeScript
- **Frontend**: React, React Router, Vite, Vanilla CSS
