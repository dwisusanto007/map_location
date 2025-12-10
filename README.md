# Location Search App

Location search web app using Google Maps Places API with interactive map.

## Setup

1. Copy environment files:
```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

2. Add your Google Maps API key to both `.env` files:
```
GOOGLE_MAPS_API_KEY=your_api_key_here
```

3. Run with Docker:
```bash
docker compose up --build
```

## Access

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Features

- Real-time location search
- Interactive Google Maps
- Minimum 3 location results
- Click markers to highlight and zoom
- Loading states and error handling
- Secure API key handling (backend only)

## Security

- API keys are stored in `.env` files (not committed to git)
- Backend acts as proxy to protect API keys
- Environment variables properly configured for Docker

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Maps: Google Maps JavaScript SDK + Places API
- Deployment: Docker + Docker Compose