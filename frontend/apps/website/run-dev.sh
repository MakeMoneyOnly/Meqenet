#!/bin/bash
echo "Installing dependencies..."
npm install
echo "Setting up environment..."
cp .env.example .env.local 2>/dev/null || true
echo "Starting development server..."
npm run dev
