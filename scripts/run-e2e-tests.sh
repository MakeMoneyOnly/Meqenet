#!/bin/bash

set -e

# Start services
docker-compose -f docker-compose.e2e.yml up -d

# Wait for services to be healthy
# TODO: Implement proper health checks
sleep 10

# Seed database
# Assuming the seed script is executable and connects to the e2e database
# You might need to configure the DATABASE_URL for the seed script
# export DATABASE_URL=postgresql://test:test@localhost:5433/test
# ts-node scripts/seed.ts

# Run tests
# Using the existing test:e2e script, but this should be changed to Vitest
pnpm test:e2e

# Cleanup database
# This could be done by another script or by restarting the db container

# Stop services
docker-compose -f docker-compose.e2e.yml down
