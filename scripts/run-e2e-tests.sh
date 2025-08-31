#!/bin/bash
set -e

echo "Starting E2E test environment..."

# Start services in the background
docker-compose -f docker-compose.e2e.yml up -d --build

# Wait for services to be healthy
echo "Waiting for services to be ready..."
# In a real scenario, you would use a more robust health check mechanism
sleep 30

# Run the E2E tests
# This assumes your E2E test runner is configured in the package.json test:e2e script
echo "Running E2E tests..."
pnpm run test:e2e

# Stop and remove the containers
echo "Tearing down E2E test environment..."
docker-compose -f docker-compose.e2e.yml down