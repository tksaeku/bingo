# 🎯 Bingo Game Application

A full-stack bingo game built with Node.js, TypeScript, React, SCSS, and MongoDB.

## Features

- **Interactive Bingo Board**: 5x5 grid with clickable cells and automatic win detection
- **Options Management**: Add and remove custom bingo options
- **Leaderboard**: Track winners and their win counts
- **Win Celebration**: Confetti animation and player name submission
- **Play Again**: Instantly generate a new board after winning

## Tech Stack

### Backend
- Node.js + Express
- TypeScript
- Firestore (Firebase) — replaces MongoDB/Mongoose
- CORS enabled

### Frontend
- React 19 + TypeScript
- Vite
- React Router for navigation
- SCSS for styling
- Axios for API calls

## Prerequisites

- Node.js (v18 or higher)
- A Firebase project with Firestore enabled and a service account JSON
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bingo
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Install server dependencies**
   ```bash
   cd server
   npm install
   cd ..
   ```

4. **Install client dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

5. **Configure environment variables**

   The server now uses Firestore instead of MongoDB. You must provide Firebase credentials to the server in one of two ways:

   Option A (recommended): set `GOOGLE_APPLICATION_CREDENTIALS` to the path of your service account JSON file.

   Option B: set `FIREBASE_SERVICE_ACCOUNT` to the base64-encoded contents of your service account JSON (useful for CI).

   Example `server/.env` (you can copy `server/.env.example`):
   ```
   PORT=5174
   NODE_ENV=development
   # Option A (use one of these):
   # GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
   # Option B (alternative):
   # FIREBASE_SERVICE_ACCOUNT=<base64-encoded-service-account-json>
   ```

## Running the Application

### Firestore credentials

Before starting the server ensure Firestore credentials are available via `GOOGLE_APPLICATION_CREDENTIALS` or `FIREBASE_SERVICE_ACCOUNT` (see `server/.env.example`).

### Option 1: Run both server and client together

From the root directory:
```bash
npm run dev
```

This will start:
- Backend server on http://localhost:5174
- Frontend client on http://localhost:5173

### Option 2: Run server and client separately

**Terminal 1 - Start the server:**
```bash
npm run dev:server
```

**Terminal 2 - Start the client:**
```bash
npm run dev:client
```

## Usage

1. **Add Options**: Navigate to "Manage Options" and add at least 24 bingo options
2. **Play**: Go to "Play" to see your bingo board
3. **Mark Cells**: Click cells to mark them
4. **Win**: Complete a row, column, or diagonal to win
5. **Submit Score**: Enter your name and play again
6. **View Leaderboard**: Check the "Leaderboard" to see top players

## Project Structure

```
bingo/
├── server/               # Backend API
│   ├── src/
│   │   ├── models/      # Firestore-backed data access
│   │   ├── routes/      # Express routes
│   │   └── index.ts     # Server entry point
│   ├── .env.example     # Environment variable examples for Firestore
   │   └── package.json
├── client/              # Frontend React app
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # API service
│   │   ├── App.tsx      # Main app with routing
│   │   └── main.tsx     # Entry point
│   └── package.json
└── package.json         # Root workspace config
```

## API Endpoints

### Options
- `GET /api/options` - Get all options
- `POST /api/options` - Create new option
- `DELETE /api/options/:id` - Delete option

### Leaderboard
- `GET /api/leaderboard` - Get leaderboard (top 20)
- `POST /api/leaderboard` - Submit a win

## Building for Production

```bash
npm run build
```

To start the production server:
```bash
npm start
```

## License

See LICENSE file for details.
Bingo app!
