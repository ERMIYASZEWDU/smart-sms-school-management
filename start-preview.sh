#!/bin/sh
# Freebuff preview launcher.
# Runs the Express backend (with an in-memory MongoDB via server/preview.js)
# in the background, then starts the Vite dev server in the foreground.

set -e

# Ensure backend dependencies are installed
if [ ! -d "server/node_modules" ]; then
  echo "Installing backend dependencies..."
  npm install --prefix server
fi

# Start the backend (port 5000), then the frontend (port 5173)
node server/preview.js &
npm run dev -- --host 0.0.0.0
