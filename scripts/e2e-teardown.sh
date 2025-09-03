#!/bin/bash

echo "Tearing down E2E test database..."

pnpm db:reset

echo "Database teardown complete."
