#!/bin/bash

echo "Setting up E2E test database..."

echo "Running database migrations..."
pnpm db:migrate

echo "Seeding database..."
pnpm db:seed

echo "Database setup complete."
